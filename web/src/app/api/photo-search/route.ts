import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Save uploaded file to temp directory
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempDir = join(tmpdir(), 'myfootprint-photos');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch {
      // Directory may already exist
    }

    const tempFilePath = join(tempDir, `${randomUUID()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Run photo_search.py
    const result = await runPhotoSearch(tempFilePath);

    // Cleanup temp file
    try {
      await unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Photo search error:', error);
    return NextResponse.json(
      { error: 'Photo search failed', details: String(error) },
      { status: 500 }
    );
  }
}

function runPhotoSearch(imagePath: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(process.cwd(), '..', 'photo_search.py');

    const pythonProcess = spawn('python', [scriptPath, imagePath, '--json'], {
      cwd: join(process.cwd(), '..'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr);
        // Return partial results even on error
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          resolve({
            error: `Photo analysis failed (code ${code})`,
            face_analysis: null,
            reverse_search_links: getManualSearchLinks(),
            risk_score: 0,
            employment_flags: []
          });
        }
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch {
        // Return manual search links if parsing fails
        resolve({
          face_analysis: { error: 'Analysis unavailable' },
          reverse_search_links: getManualSearchLinks(),
          risk_score: 0,
          employment_flags: [],
          note: 'DeepFace analysis unavailable - use manual search links below'
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python:', err);
      // Return manual search links as fallback
      resolve({
        face_analysis: { error: 'Python not available' },
        reverse_search_links: getManualSearchLinks(),
        risk_score: 0,
        employment_flags: [],
        note: 'Automated analysis unavailable - use manual search links below'
      });
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        face_analysis: { error: 'Analysis timed out' },
        reverse_search_links: getManualSearchLinks(),
        risk_score: 0,
        employment_flags: [],
        note: 'Analysis timed out - use manual search links below'
      });
    }, 60000);
  });
}

function getManualSearchLinks() {
  return [
    {
      name: 'PimEyes',
      url: 'https://pimeyes.com/',
      description: 'Best face recognition search - finds adult content, social media',
      type: 'face_search'
    },
    {
      name: 'FaceCheck.ID',
      url: 'https://facecheck.id/',
      description: 'Free face recognition search engine',
      type: 'face_search'
    },
    {
      name: 'Google Images',
      url: 'https://images.google.com/',
      description: 'Reverse image search',
      type: 'reverse_search'
    },
    {
      name: 'Yandex Images',
      url: 'https://yandex.com/images/',
      description: 'Best for finding social profiles',
      type: 'reverse_search'
    },
    {
      name: 'TinEye',
      url: 'https://tineye.com/',
      description: 'Find where this image appears online',
      type: 'reverse_search'
    },
    {
      name: 'Search4Faces',
      url: 'https://search4faces.com/',
      description: 'VK and OK.ru face search',
      type: 'face_search'
    },
    {
      name: 'SocialCatfish',
      url: 'https://socialcatfish.com/',
      description: 'Dating profile and identity search',
      type: 'identity_search'
    },
    {
      name: 'Lenso.ai',
      url: 'https://lenso.ai/',
      description: 'AI-powered face and image search',
      type: 'face_search'
    }
  ];
}

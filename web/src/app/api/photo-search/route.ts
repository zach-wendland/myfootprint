import { NextRequest, NextResponse } from 'next/server';

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

    // In serverless environment, we can't run DeepFace
    // Return manual search links for face recognition services
    const result = {
      face_analysis: {
        note: 'Automated face analysis requires local Python environment',
        serverless: true
      },
      reverse_search_links: [
        {
          name: 'PimEyes',
          url: 'https://pimeyes.com/',
          description: 'Best face recognition search - finds adult content, social media',
          type: 'face_search',
          priority: 1
        },
        {
          name: 'FaceCheck.ID',
          url: 'https://facecheck.id/',
          description: 'Free face recognition search engine',
          type: 'face_search',
          priority: 2
        },
        {
          name: 'Search4Faces',
          url: 'https://search4faces.com/',
          description: 'VK and OK.ru face search (Russian social networks)',
          type: 'face_search',
          priority: 3
        },
        {
          name: 'Google Images',
          url: 'https://images.google.com/',
          description: 'Upload image for reverse search',
          type: 'reverse_search'
        },
        {
          name: 'Yandex Images',
          url: 'https://yandex.com/images/',
          description: 'Best for finding social profiles (especially Russian)',
          type: 'reverse_search'
        },
        {
          name: 'TinEye',
          url: 'https://tineye.com/',
          description: 'Find where this image appears online',
          type: 'reverse_search'
        },
        {
          name: 'Bing Visual Search',
          url: 'https://www.bing.com/visualsearch',
          description: 'Microsoft reverse image search',
          type: 'reverse_search'
        },
        {
          name: 'Lenso.ai',
          url: 'https://lenso.ai/',
          description: 'AI-powered face and image search',
          type: 'face_search'
        },
        {
          name: 'SocialCatfish',
          url: 'https://socialcatfish.com/',
          description: 'Dating profile and identity search',
          type: 'identity_search'
        },
        {
          name: 'Baidu Images',
          url: 'https://image.baidu.com/',
          description: 'Best for finding Chinese sources',
          type: 'reverse_search'
        }
      ],
      risk_score: 0,
      employment_flags: [],
      note: 'Upload your photo to the services above for face recognition search. PimEyes and FaceCheck.ID are recommended for finding social media profiles and potential adult content.'
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Photo search error:', error);
    return NextResponse.json(
      { error: 'Photo search failed', details: String(error) },
      { status: 500 }
    );
  }
}

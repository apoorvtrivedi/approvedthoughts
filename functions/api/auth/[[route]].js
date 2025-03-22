export async function onRequest(context) {
    const clientId = Ov23liWc80V5gPeqWnwm;  // Replace with your GitHub OAuth App Client ID
    const clientSecret = '7e95e01fd05051f783a19db3898c59731c8d182a';  // Replace with your GitHub OAuth App Client Secret
  
    const { request } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      // Redirect to GitHub OAuth
      return Response.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo`, 302);
    }
  
    // Exchange the code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });
  
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      return new Response(JSON.stringify({ error: tokenData.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    // Redirect back to the CMS with the token
    const redirectUrl = url.searchParams.get('callback') || '/admin/';
    const responseHtml = `
      <html>
        <head>
          <script>
            // Store the token
            const token = ${JSON.stringify(tokenData)};
            localStorage.setItem('netlify-cms-github-token', JSON.stringify(token));
            // Redirect back to the admin
            window.location.href = "${redirectUrl}";
          </script>
        </head>
        <body>
          Authenticating...
        </body>
      </html>
    `;
  
    return new Response(responseHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
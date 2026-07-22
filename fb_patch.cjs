const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const fbFetchBlock = `
      // 2. Facebook Graph API Real Fetch
      if (fbAccessToken && fbPageId) {
        try {
          const fbUrl = \`https://graph.facebook.com/v19.0/\${fbPageId}/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media_type,media,url}&access_token=\${fbAccessToken}&limit=10\`;
          const fbResponse = await fetch(fbUrl);
          if (fbResponse.ok) {
            const fbResult = await fbResponse.json();
            if (fbResult.data && Array.isArray(fbResult.data)) {
              const currentVideos = await readCollection("videos");
              const currentPhotos = await readCollection("photos");
              let addedFbVideos = 0;
              let addedFbPhotos = 0;
              
              for (const post of fbResult.data) {
                const message = post.message || "Postingan Facebook";
                const title = message.length > 60 ? message.substring(0, 60) + '...' : message;
                const permalink = post.permalink_url || \`https://www.facebook.com/\${post.id}\`;
                
                let isVideo = false;
                let isPhoto = false;
                let mediaUrl = post.full_picture;
                
                if (post.attachments && post.attachments.data && post.attachments.data.length > 0) {
                  const attachment = post.attachments.data[0];
                  if (attachment.media_type === 'video' || attachment.media_type === 'video_inline') {
                    isVideo = true;
                  } else if (attachment.media_type === 'photo' || attachment.media_type === 'album') {
                    isPhoto = true;
                  }
                } else if (post.full_picture) {
                   isPhoto = true;
                }
                
                if (isVideo) {
                  const exists = currentVideos.some(v => v.videoUrl === permalink || v.id === "fb-" + post.id);
                  if (!exists) {
                    const newVideo = {
                      id: "fb-" + post.id,
                      title,
                      videoUrl: permalink,
                      thumbnail: mediaUrl || "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=400",
                      duration: "00:00",
                      createdAt: post.created_time || new Date().toISOString()
                    };
                    if (useMySQL && pool) {
                      await pool.query('INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)', [newVideo.id, 'videos', JSON.stringify(newVideo)]);
                    } else {
                      currentVideos.unshift(newVideo);
                    }
                    addedFbVideos++;
                    fetchedCount++;
                    logs.push(\`Berhasil mengimpor Video FB: "\${title}"\`);
                  }
                } else if (isPhoto && mediaUrl) {
                  const exists = currentPhotos.some(p => p.image === mediaUrl || p.id === "fb-" + post.id);
                  if (!exists) {
                    const newPhoto = {
                      id: "fb-" + post.id,
                      title,
                      image: mediaUrl,
                      createdAt: post.created_time || new Date().toISOString()
                    };
                    if (useMySQL && pool) {
                      await pool.query('INSERT INTO collections (id, collection_name, data) VALUES (?, ?, ?)', [newPhoto.id, 'photos', JSON.stringify(newPhoto)]);
                    } else {
                      currentPhotos.unshift(newPhoto);
                    }
                    addedFbPhotos++;
                    fetchedCount++;
                    logs.push(\`Berhasil mengimpor Foto FB: "\${title}"\`);
                  }
                }
              }
              
              if (addedFbVideos > 0 && !useMySQL) await writeCollection("videos", currentVideos);
              if (addedFbPhotos > 0 && !useMySQL) await writeCollection("photos", currentPhotos);
            }
          } else {
            const errText = await fbResponse.text();
            console.error("Facebook API error:", errText);
            logs.push("Koneksi Facebook Gagal: Harap periksa kembali Token dan ID Page.");
          }
        } catch (fbErr) {
          console.error("Facebook auto-fetch error:", fbErr);
          logs.push(\`Kesalahan sinkronisasi Facebook: \${fbErr.message}\`);
        }
      }
`;

code = code.replace(
  /\/\/ 2\. High fidelity TikTok \/ Facebook mock simulation/,
  fbFetchBlock + '\n      // 3. High fidelity TikTok mock simulation'
);

code = code.replace(
  /if \(tkClientKey \|\| fbAccessToken \|\| \(\!ytApiKey \&\& \!ytChannelId\)\) \{/,
  'if (!fbAccessToken && (tkClientKey || (!ytApiKey && !ytChannelId))) {'
);

fs.writeFileSync('server.ts', code);

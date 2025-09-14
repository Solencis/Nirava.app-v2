@@ .. @@
               <div className="flex items-center">
                 <div className="w-7 h-7 bg-wasabi/20 rounded-full flex items-center justify-center mr-2">
                   <span className="text-wasabi font-bold text-xs">{post.profiles.level}</span>
                 </div>
                {userProfileData.photo_url && (
                  <img
                    src={userProfileData.photo_url}
                    alt={`Photo de ${userProfileData.display_name}`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm mr-2"
                  />
                )}
+                {post.profiles.photo_url ? (
+                  <img
+                    src={post.profiles.photo_url}
+                    alt={`Photo de ${post.profiles.display_name}`}
+                    className="w-8 h-8 rounded-full object-cover border border-stone/20 mr-2"
+                  />
+                ) : (
+                  <div className="w-8 h-8 bg-wasabi/10 rounded-full flex items-center justify-center mr-2">
+                    <User size={14} className="text-wasabi" />
+                  </div>
+                )}
                 <button
                   onClick={() => handleUserClick(post.user_id)}
                   className="text-left hover:bg-stone/5 rounded-md p-1 -m-1 transition-colors duration-200"
                 >
                   <div className="font-semibold text-xs text-gray-700">{post.profiles.display_name}</div>
                   <div className="text-xs text-stone">{post.profiles.level}</div>
                 </button>
               </div>
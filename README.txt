FG MATERIAL GALLERY — COMPLETE SEARCHABLE SITE

Included:
- index.html       Main page
- gallery.css      Styling
- script.js        Search, pagination and photo viewer
- materials.js     227 records exported from MATERIAL DIRECTORY.xlsx
- photos.js        Photo index placeholder (generated from your actual photo folders)
- build_photo_index.py  Scans material-code folders and creates photos.js

SETUP YOUR ACTUAL PHOTOS
1. Extract the contents of your GALLERY.zip into a folder named GALLERY beside index.html.
   Example:
     FG_Material_Gallery_Complete/
       index.html
       gallery.css
       script.js
       materials.js
       photos.js
       build_photo_index.py
       GALLERY/
         FNA-PE11005/
           FNA-PE11005(1).jpg
           FNA-PE11005(2).jpg
         2201168S1B/
           2201168S1B(1).jpg
2. Install Python 3 if it is not already installed.
3. Open Command Prompt in the FG_Material_Gallery_Complete folder and run:
     python build_photo_index.py
   On some Windows computers, use:
     py build_photo_index.py
4. Double-click index.html to use the gallery. Search by material code or name and click SOURCE.

IMPORTANT
- The actual GALLERY.zip photo archive was not available in the files I could inspect when creating this package. So the package contains the 227-row directory and the full gallery code, but not the actual photos. Put your already-existing extracted photo folders in GALLERY and run the index builder once.
- You do not upload/select the ZIP on the website, and you do not need to re-index each time you search. After setup, the photo index stays in photos.js.
- For a published website, upload the site files plus the GALLERY photo folders and generated photos.js to your hosting/repository. Those image files will be accessible to anyone who can access that site unless you use private hosting.
- The existing Lark links are retained in materials.js as directory data, but SOURCE opens local photos and does not navigate to those links.

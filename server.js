const express=require('express'), path=require('path'), Database=require('better-sqlite3'), bcrypt=require('bcryptjs'), jwt=require('jsonwebtoken'), multer=require('multer'), fs=require('fs');
const app=express(), PORT=process.env.PORT||3000, JWT_SECRET=process.env.JWT_SECRET||'change-this-secret-in-production';
const db=new Database(path.join(__dirname,'data.db'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS services(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT NOT NULL,icon TEXT,tags TEXT);
CREATE TABLE IF NOT EXISTS gallery(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,image TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,role TEXT,text TEXT NOT NULL,initials TEXT);
CREATE TABLE IF NOT EXISTS enquiries(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT,service TEXT,message TEXT NOT NULL,status TEXT DEFAULT 'new',created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
if(!db.prepare('SELECT id FROM admins LIMIT 1').get()){db.prepare('INSERT INTO admins(username,password_hash) VALUES(?,?)').run('admin',bcrypt.hashSync('Admin@12345',10));}
if(db.prepare('SELECT COUNT(*) c FROM services').get().c===0){const a=db.prepare('INSERT INTO services(title,description,icon,tags) VALUES(?,?,?,?)');[
['Marble Cutting','Precise cutting for slabs, surfaces, floors, walls and custom shapes.','🪨','Custom Sizes,Clean Edges'],
['Granite Cutting','Heavy-duty granite cutting for kitchens, bathrooms and stair steps.','💎','All Thicknesses,Large Orders'],
['Surface Finishing','High-gloss polishing plus honed, matte and leather finishes.','✨','Glossy,Honed,Leather'],
['Edge Profiling','Rounded, beveled, curved and waterfall edges for elegant stonework.','🔲','10+ Edge Types'],
['Waterjet Cutting','Millimeter-accurate mosaics, medallions and custom patterns.','💧','Mosaics,Medallions'],
['Restoration & Repair','Crack filling, stain removal, repolishing and surface restoration.','🔧','Crack Repair,Repolishing']
].forEach(x=>a.run(...x));}
if(db.prepare('SELECT COUNT(*) c FROM gallery').get().c===0){const a=db.prepare('INSERT INTO gallery(title,image) VALUES(?,?)');[['Indoor Marble Showroom','/assets/img1.jpg'],['Al Bidoor Marble Exterior','/assets/img2.jpg'],['Company Building & Workshop','/assets/img3.jpg'],['Indoor Showroom','/assets/img4.jpg']].forEach(x=>a.run(...x));}
if(db.prepare('SELECT COUNT(*) c FROM testimonials').get().c===0){const a=db.prepare('INSERT INTO testimonials(name,role,text,initials) VALUES(?,?,?,?)');[['Ahmed Al Harthi','Homeowner, Muscat','Excellent work on our kitchen surfaces. The cutting was precise and the finishing was excellent.','AH'],['Salim Al Balushi','Interior Designer','We used them for a hotel lobby flooring project. Quality and accuracy were impressive.','SB'],['Fatima Al Riyami','Architect','Their waterjet patterns for our showroom floor were beautifully executed.','FR']].forEach(x=>a.run(...x));}

app.use(express.json()); app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
const uploadDir=path.join(__dirname,'public/assets'); fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({storage:multer.diskStorage({destination:uploadDir,filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_'))}),limits:{fileSize:5*1024*1024}});

function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))throw 0;req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch{res.status(401).json({message:'Unauthorized'})}}
app.get('/api/public',(req,res)=>res.json({services:db.prepare('SELECT * FROM services ORDER BY id').all(),gallery:db.prepare('SELECT * FROM gallery ORDER BY id DESC').all(),testimonials:db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all()}));
app.post('/api/enquiries',(req,res)=>{const {name,phone,email,service,message}=req.body;if(!name||!phone||!message)return res.status(400).json({message:'Name, phone and project details are required.'});db.prepare('INSERT INTO enquiries(name,phone,email,service,message) VALUES(?,?,?,?,?)').run(name,phone,email||'',service||'',message);res.json({message:'Thank you. Your enquiry has been received.'})});
app.post('/api/admin/login',(req,res)=>{const {username,password}=req.body, u=db.prepare('SELECT * FROM admins WHERE username=?').get(username);if(!u||!bcrypt.compareSync(password,u.password_hash))return res.status(401).json({message:'Invalid username or password'});res.json({token:jwt.sign({id:u.id,username:u.username},JWT_SECRET,{expiresIn:'8h'})})});
app.get('/api/admin/enquiries',auth,(req,res)=>res.json(db.prepare('SELECT * FROM enquiries ORDER BY id DESC').all()));
app.patch('/api/admin/enquiries/:id',auth,(req,res)=>{db.prepare('UPDATE enquiries SET status=? WHERE id=?').run(req.body.status,req.params.id);res.json({ok:true})});
app.delete('/api/admin/enquiries/:id',auth,(req,res)=>{db.prepare('DELETE FROM enquiries WHERE id=?').run(req.params.id);res.json({ok:true})});
function crud(table,fields){app.get('/api/admin/'+table,auth,(req,res)=>res.json(db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all()));app.post('/api/admin/'+table,auth,(req,res)=>{const vals=fields.map(f=>req.body[f]??'');const qs=fields.map(()=>'?').join(',');const info=db.prepare(`INSERT INTO ${table}(${fields.join(',')}) VALUES(${qs})`).run(...vals);res.json(db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(info.lastInsertRowid));});app.put('/api/admin/'+table+'/:id',auth,(req,res)=>{const vals=fields.map(f=>req.body[f]??'');db.prepare(`UPDATE ${table} SET ${fields.map(f=>f+'=?').join(',')} WHERE id=?`).run(...vals,req.params.id);res.json({ok:true})});app.delete('/api/admin/'+table+'/:id',auth,(req,res)=>{db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);res.json({ok:true})});}
crud('services',['title','description','icon','tags']);crud('gallery',['title','image']);crud('testimonials',['name','role','text','initials']);
app.post('/api/admin/upload',auth,upload.single('image'),(req,res)=>res.json({url:'/assets/'+req.file.filename}));
app.get('/admin',(req,res)=>res.sendFile(path.join(__dirname,'public/admin.html'))); app.post('/api/admin/change-password',auth,(req,res)=>{
  const {currentPassword,newPassword}=req.body;

  if(!currentPassword || !newPassword){
    return res.status(400).json({
      message:'Current password and new password are required.'
    });
  }

  if(newPassword.length < 8){
    return res.status(400).json({
      message:'New password must be at least 8 characters.'
    });
  }

  const user=db.prepare(
    'SELECT * FROM admins WHERE id=?'
  ).get(req.user.id);

  if(!user || !bcrypt.compareSync(currentPassword,user.password_hash)){
    return res.status(401).json({
      message:'Current password is incorrect.'
    });
  }

  const newHash=bcrypt.hashSync(newPassword,10);

  db.prepare(
    'UPDATE admins SET password_hash=? WHERE id=?'
  ).run(newHash,req.user.id);

  res.json({
    message:'Password changed successfully.'
  });
});
app.listen(PORT,()=>console.log(`Al Bidoor Marble running on http://localhost:${PORT}`));

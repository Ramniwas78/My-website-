# Al Bidoor Marble — Full-Stack Website

This project converts the supplied Arabic static site into an English full-stack website with:
- English frontend
- Node.js + Express backend
- SQLite database
- Contact/enquiry form stored in the database
- JWT-protected admin panel
- Admin CRUD for Services, Gallery and Testimonials
- Enquiry management
- Image upload endpoint
- Responsive design

## Requirements
Node.js 18+ recommended.

## Run
```bash
npm install
npm start
```


## Assets
Put the original `logo.jpg`, `img1.jpg`, `img2.jpg`, `img3.jpg`, and `img4.jpg` inside `public/assets/`.

The uploaded source used these image names and the original page contained the company contact number +968 9627 2666 and Sinaw, Ash Sharqiyah, Oman. The English version keeps those details.

## Production
Set a strong `JWT_SECRET` environment variable and use HTTPS. For a production deployment, consider PostgreSQL/MySQL, server-side rate limiting, email notifications, backups and stronger admin password management.

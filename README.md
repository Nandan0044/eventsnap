# EventSnap 📸

A real-time event photo sharing platform. Create an event, share a QR code, and watch photos pour in from everyone at the venue — instantly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Socket.io-client, Recharts |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB (via Mongoose) |
| File Storage | Cloudinary |
| Auth | JWT (JSON Web Tokens) |
| Real-time | WebSockets (Socket.io) |

---

## Project Structure

```
eventsnap/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js     # Cloudinary + Multer setup
│   │   └── db.js             # MongoDB connection
│   ├── middleware/
│   │   └── auth.js           # JWT protect + optionalAuth
│   ├── models/
│   │   ├── User.js           # User schema
│   │   ├── Event.js          # Event schema
│   │   └── Photo.js          # Photo schema
│   ├── routes/
│   │   ├── auth.js           # /api/auth (register, login, me)
│   │   ├── events.js         # /api/events (CRUD + analytics)
│   │   └── photos.js         # /api/photos (upload, like, flag, delete)
│   ├── server.js             # Express app + Socket.io
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── Navbar.css
    │   ├── context/
    │   │   └── AuthContext.js   # Global auth state
    │   ├── hooks/
    │   │   └── useSocket.js     # Socket.io real-time hook
    │   ├── pages/
    │   │   ├── Home.js/css      # Landing page
    │   │   ├── Auth.js/css      # Login + Register
    │   │   ├── Dashboard.js/css # Organiser's events
    │   │   ├── CreateEvent.js/css
    │   │   ├── EventGallery.js/css  # Main gallery + upload + QR
    │   │   ├── Analytics.js/css # Charts + stats
    │   │   └── Join.js/css      # Join by code
    │   ├── styles/
    │   │   └── global.css       # Design system, no Tailwind
    │   ├── utils/
    │   │   └── api.js           # Axios instance
    │   ├── App.js               # Routes
    │   └── index.js             # Entry point
    ├── package.json
    └── .env.example
```

---

## Prerequisites

Make sure you have these installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or a free MongoDB Atlas cluster)
- A free [Cloudinary](https://cloudinary.com) account (for photo storage)

---

## Setup — Step by Step

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/eventsnap.git
cd eventsnap
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventsnap
JWT_SECRET=make_this_a_long_random_string_at_least_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

**Where to get Cloudinary credentials:**
1. Sign up at https://cloudinary.com (free)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret

**Start the backend:**

```bash
npm run dev
```

You should see:
```
EventSnap server running on port 5000
MongoDB connected: localhost
```

---

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

**Start the frontend:**

```bash
npm start
```

App opens at http://localhost:3000

---

## API Endpoints

### Auth
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes |

### Events
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/events | Create event | Yes |
| GET | /api/events/my | Get my events | Yes |
| GET | /api/events/join/:code | Find event by code | No |
| GET | /api/events/:id | Get event details | No |
| GET | /api/events/:id/analytics | Get analytics | Yes (organiser) |
| DELETE | /api/events/:id | Delete event + all photos | Yes (organiser) |

### Photos
| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/photos/upload | Upload photos | Optional |
| GET | /api/photos/event/:id | Get event photos | No |
| POST | /api/photos/:id/like | Toggle like | No |
| POST | /api/photos/:id/flag | Flag photo | No |
| DELETE | /api/photos/:id | Delete photo | Yes (organiser) |
| GET | /api/photos/event/:id/highlights | Top liked photos | No |

---

## Features

### For Guests (no account needed)
- Join event by code or QR scan
- Upload up to 20 photos at once (20MB each)
- Like photos
- Download any photo
- Flag inappropriate photos
- See real-time updates as others upload

### For Organisers (account required)
- Create events with name, date, description, cover image
- Auto-generated unique event code + QR code
- Dashboard to manage all events
- Delete photos or entire events
- Analytics dashboard:
  - Upload activity by hour (bar chart)
  - Top contributors
  - Most liked photos
  - Storage used
- Real-time: new photos appear instantly for all viewers

---

## Real-time — How it works

Uses **Socket.io** for WebSocket communication.

1. When a user opens the event gallery page, they join a socket room named by `eventId`
2. When someone uploads a photo, the backend emits `new_photo` to everyone in that room
3. When someone likes a photo, `photo_liked` is emitted with the updated count
4. When an organiser deletes a photo, `photo_deleted` is emitted to remove it from all screens

No page refresh needed. Photos appear live.

---

## Deployment

### Backend → Railway or Render (free)

1. Push backend to GitHub
2. Create a new Web Service on [Railway](https://railway.app) or [Render](https://render.com)
3. Set environment variables from your `.env`
4. Deploy — get a URL like `https://eventsnap-api.railway.app`

### Frontend → Vercel (free)

1. Push frontend to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to your backend URL
4. Deploy — get a URL like `https://eventsnap.vercel.app`

### Database → MongoDB Atlas (free tier)

1. Create cluster at https://cloud.mongodb.com
2. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/eventsnap`
3. Replace `MONGODB_URI` in your backend env

---

## Resume Talking Points

- "Built a full-stack event photo sharing platform with React and Node.js/Express"
- "Implemented real-time photo sync using Socket.io — photos appear on all connected screens without a page refresh"
- "Integrated Cloudinary for image upload with automatic compression and thumbnail generation"
- "Built JWT-based authentication with optional guest access — no login required to upload"
- "Designed a RESTful API with 12+ endpoints, rate limiting, and role-based access control"
- "Added an analytics dashboard with Recharts showing upload activity heatmaps and contributor stats"

---

## What to add next (for extra points)

- [ ] WhatsApp bot upload via Twilio
- [ ] Blur/duplicate detection on upload
- [ ] Face-based photo search (AWS Rekognition)
- [ ] PWA support (offline gallery viewing)
- [ ] Download all photos as ZIP
- [ ] Email notification to organiser when flagged photo is reported

---

## License

MIT

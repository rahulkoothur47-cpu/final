# Bus Tracker - Real-Time Bus Tracking System

A real-time bus tracking application built with Next.js, React Leaflet, and Firebase.

## Features

- 🚌 Real-time bus location tracking
- 🗺️ Interactive maps with actual road routes
- 📍 Bus stop markers with GPS coordinates
- 📊 Linear route progress visualization
- 🎯 ETA calculation based on distance and speed
- 📱 Mobile-responsive design
- 🚨 Off-route detection and alerts

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Mapping**: Leaflet, React Leaflet, OpenStreetMap
- **Backend**: Firebase Realtime Database
- **Routing**: OSRM (OpenStreetMap Routing Machine)
- **Hosting**: Vercel

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local with your Firebase credentials:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyANkSy9yGcORlDYCLIQ9nW1RWNXbp3sqXM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bus-tracker-5ef06.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://bus-tracker-5ef06-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bus-tracker-5ef06
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bus-tracker-5ef06.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=656816196934
NEXT_PUBLIC_FIREBASE_APP_ID=1:656816196934:web:06bcaf2226cd8664b2a947


# Run development server
npm run dev

# Open http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Vercel account (vercel.com)
- Firebase project with Realtime Database

### Step-by-Step Deployment

1. **Push code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Select your repository
   - Click "Import"

3. **Configure Environment Variables**
   - Go to "Settings" → "Environment Variables"
   - Add all `NEXT_PUBLIC_FIREBASE_*` variables from your `.env.local`
   - **Important**: Use the same values as your local setup
   - Save and redeploy

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live on a Vercel domain

### Custom Domain (Optional)

1. In Vercel Project Settings → "Domains"
2. Add your custom domain
3. Update DNS records with Vercel's nameservers
4. Wait for DNS propagation (up to 48 hours)

## Firebase Configuration

### Setting Up Firebase

1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Create a Realtime Database
3. Set Database Rules:
   ```json
   {
     "rules": {
       "buses": {
         "$bus_id": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

### Backend Data Format

Send bus location data to Firebase at path `bus_1`, `bus_2`, etc.:

```json
{
  "latitude": 12.12852,
  "longitude": 75.19865,
  "speed": 45.5,
  "altitude": 20.8,
  "timestamp": 1704067200000
}
```

## API Endpoints

- **Maps**: OpenStreetMap (OSM)
- **Routing**: OSRM (Free, no API key required)
- **Markers**: Leaflet Color Markers

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

- ✅ Next.js Image Optimization
- ✅ Code Splitting
- ✅ CSS Minification
- ✅ Tree Shaking
- ✅ Dynamic Imports for Leaflet

## Troubleshooting

### Map not loading
- Check browser console for errors
- Verify OpenStreetMap tiles are accessible
- Clear browser cache and reload

### Firebase not connecting
- Verify Firebase credentials in environment variables
- Check Firebase Database rules allow read/write
- Ensure `bus_1`, `bus_2` paths exist in database

### Routing not working
- OSRM API may be slow with many stops
- Fallback to straight lines if OSRM fails
- Consider increasing timeout if needed

## Project Structure

```
bus/
├── src/
│   ├── app/
│   │   ├── page.js              # Home page
│   │   ├── busmap/
│   │   │   └── page.js          # Bus tracking page
│   │   ├── globals.css          # Global styles
│   │   └── layout.js            # App layout
│   ├── components/
│   │   ├── BusLiveMap.js        # Map component
│   │   └── LinearRouteMap.js    # Route progress component
│   └── lib/
│       └── firebase.js          # Firebase config
├── public/                       # Static files
├── .env.local                    # Environment variables (local only)
├── vercel.json                   # Vercel config
├── next.config.mjs              # Next.js config
└── package.json                 # Dependencies
```

## License

Private Project

## Contact

For support, contact the development team.

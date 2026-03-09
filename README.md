# Circlepot

Circlepot is a community savings platform that lets users deposit and withdraw in local currency while saving in stable digital dollars through automated, trustless savings circles and personal goals.

Built with [Next.js](https://nextjs.org) 16, TypeScript, and Tailwind CSS v4.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example below to create your `.env` file:

```bash
cp .env.example .env
```

Or create a `.env` file in the root directory with the following variables:

```env
# VAPID Keys for Web Push Notifications
# Generate your own keys with: npx web-push generate-vapid-keys
# VAPID Keys for Web Push Notifications
# Generate your own keys with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here

# Dynamic XYZ 
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=
NEXT_PUBLIC_GELATO_API_KEY=your_gelato_api_key_here


# MongoDB
MONGODB_URI=mongodb+srv://

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Blockchain (Relayer)
RELAYER_PRIVATE_KEY=0x

#Contract Adresses & URL
NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT=
NEXT_PUBLIC_REFERRAL_CONTRACT=
NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT=
NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT=
NEXT_PUBLIC_USDT_CONTRACT=
NEXT_PUBLIC_RPC_URL=

# App origin URL (used for JWT audience validation — match exactly)
# Local: http://localhost:3000 | Production: https://your-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# subgraph url
NEXT_PUBLIC_SUBGRAPH_URL= 


```

> **Note:** Never commit your `.env` file. It is already included in `.gitignore`.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## PWA Support

This app is configured as a Progressive Web App with:

- **Web App Manifest** — installable on mobile and desktop
- **Service Worker** — offline caching with network-first strategy
- **Install Prompt** — platform-aware install instructions (iOS, Android, Safari, Chrome)
- **Push Notification Ready** — VAPID keys and service worker handlers configured
- **Security Headers** — CSP, X-Frame-Options, and more

### Testing PWA locally

For full PWA testing (push notifications, install prompt), use HTTPS:

```bash
npx next dev --experimental-https
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features and API.
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — PWA implementation reference.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

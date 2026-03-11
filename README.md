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
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Dynamic XYZ
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=
NEXT_PUBLIC_ZERODEV_PROJECT_ID=

# MongoDB
MONGODB_URI=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Blockchain (Relayer)
RELAYER_PRIVATE_KEY=

#Contract Adresses & URL
NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT=0x4781070885eA1E2Ec9aE46201703172c576cDA1A
NEXT_PUBLIC_REFERRAL_CONTRACT=0xe5561165700e44A7725e7BcC7c7AbC9374F1a4C9
NEXT_PUBLIC_PERSONAL_SAVING_CONTRACT=0x123bff8d754b29772e1efad5b075f55600577dcd
NEXT_PUBLIC_CIRCLE_SAVING_CONTRACT=0x6e222b5507F7554A163B37C4DfC6d62dE3077fA8
NEXT_PUBLIC_USDT_CONTRACT=0xe033DDef5ef67Cbc7CeC24fe5C58eC06E9BfFD67
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# App origin URL (used for JWT audience validation — match exactly)
# Local: http://localhost:3000 | Production: https://your-domain.com
NEXT_PUBLIC_APP_URL=

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

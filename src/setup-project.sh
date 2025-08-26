#!/bin/bash

# Golf Stableford Project Setup Script
echo "🏌️  Setting up Golf Stableford project..."

# Create project directory
PROJECT_NAME="golf-stableford"
echo "📁 Creating project directory: $PROJECT_NAME"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p components/ui
mkdir -p components/figma
mkdir -p data
mkdir -p styles
mkdir -p types
mkdir -p utils
mkdir -p public
mkdir -p guidelines

# Create package.json
echo "📦 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "golf-stableford",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "cap:init": "cap init",
    "cap:sync": "cap sync",
    "cap:add:ios": "cap add ios",
    "cap:open:ios": "cap open ios",
    "cap:run:ios": "cap run ios",
    "cap:build": "npm run build && cap sync",
    "cap:build:ios": "npm run build && cap sync ios && cap open ios"
  },
  "dependencies": {
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
EOF

# Create tsconfig.json
echo "🔧 Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create vite.config.ts
echo "⚡ Creating Vite configuration..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
  },
})
EOF

# Create eslint config
echo "🔍 Creating ESLint configuration..."
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
EOF

# Create tailwind.config.js
echo "🎨 Creating Tailwind configuration..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create postcss.config.js
echo "📮 Creating PostCSS configuration..."
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create index.html
echo "🌐 Creating index.html..."
cat > index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#2d7d2d" />
    <link rel="manifest" href="/manifest.json" />
    <title>Golf Stableford</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
EOF

# Create main.tsx
echo "⚛️ Creating main.tsx..."
cat > main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

echo "✅ Project structure created!"
echo ""
echo "Next steps:"
echo "1. Copy all your component files to the respective directories"
echo "2. Copy your data files to the data/ directory"
echo "3. Copy your styles/globals.css file"
echo "4. Copy your types/index.ts file"
echo "5. Copy your utils files"
echo "6. Copy your App.tsx to the root"
echo "7. Run 'npm install' to install dependencies"
echo "8. Update the bundle identifier in capacitor.config.ts"
echo "9. Run './build-ios.sh' to build for iOS"
echo ""
echo "📂 Project directory: $(pwd)"
EOF

# Make the script executable
chmod +x setup-project.sh

echo "🎯 Setup script created!"
echo ""
echo "To create your project on MacBook:"
echo "1. Save this script as 'setup-project.sh'"
echo "2. Make it executable: chmod +x setup-project.sh"
echo "3. Run it: ./setup-project.sh"
echo "4. Follow the next steps to copy your files"
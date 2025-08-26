import liphookLogo from 'figma:asset/4e49c4f4cfb1762f0f30f35f82a406f756a43fc6.png';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`bg-white rounded-xl p-2 shadow-sm border ${className}`}>
      <img 
        src={liphookLogo} 
        alt="Liphook Golf Club" 
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
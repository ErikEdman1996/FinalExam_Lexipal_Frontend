interface MascotAvatarProps {
  mood?: 'happy' | 'focused' | 'celebrating' | 'tired';
  size?: 'sm' | 'md' | 'lg';
}

export function MascotAvatar({ mood = 'happy', size = 'md' }: MascotAvatarProps) {
  const sizeStyles = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  
  const moodEmojis = {
    happy: '😊',
    focused: '🤓',
    celebrating: '🎉',
    tired: '😴',
  };
  
  return (
    <div className={`${sizeStyles[size]} rounded-full bg-gradient-to-br from-[#A8E6CF] to-[#B3D9FF] flex items-center justify-center shadow-[0_4px_12px_rgba(168,230,207,0.3)] border-2 border-white`}>
      <span className="text-2xl">{moodEmojis[mood]}</span>
    </div>
  );
}

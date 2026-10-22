import Image from 'next/image';
import { cn } from '@/lib/utils';

export type Icon3DName =
  | 'abacus' | 'alarm' | 'bell' | 'bolt' | 'bookmark' | 'books' | 'brain' | 'bulb' | 'calendar' | 'camera'
  | 'card-box' | 'card-index' | 'chart' | 'chart-up' | 'check' | 'clapping' | 'clipboard' | 'cloud' | 'coin'
  | 'crown' | 'crystal' | 'dna' | 'file-folder' | 'fire' | 'first-place' | 'flexed' | 'game' | 'gear' | 'gem'
  | 'gift' | 'globe' | 'glowing-star' | 'grad-cap' | 'hammer' | 'headphone' | 'heart' | 'hourglass' | 'hundred'
  | 'inbox' | 'joystick' | 'key' | 'laptop' | 'locked' | 'magnifier' | 'man-student' | 'man-student-2' | 'medal'
  | 'megaphone' | 'memo' | 'microscope' | 'money-bag' | 'nerd' | 'notebook' | 'open-book' | 'paperclip' | 'party'
  | 'pencil' | 'phone' | 'puzzle' | 'raising-hand' | 'robot' | 'rocket' | 'scroll' | 'seedling'
  | 'smile-sunglasses' | 'sparkles' | 'speech' | 'sprout' | 'star' | 'star-struck' | 'stopwatch' | 'student-1'
  | 'student-2' | 'student-3' | 'sun-cloud' | 'target' | 'teacher' | 'test-tube' | 'thinking' | 'thought'
  | 'thumbs-up' | 'triangular-ruler' | 'trophy' | 'wave' | 'woman-student' | 'woman-student-2'
  | 'woman-student-3' | 'writing-hand' | 'woman-hand' | 'man-hand' | 'woman-hand-2' | 'woman-tech' | 'man-tech'
  | 'woman-teacher' | 'man-tipping' | 'woman-scientist' | 'man-celebrate' | 'person-bow' | 'woman-student-4'
  | 'man-student-3';

type Icon3DProps = {
  name: Icon3DName;
  size?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
  float?: boolean;
};

/** Glossy 3D illustration (Microsoft Fluent Emoji, MIT). */
export default function Icon3D({ name, size = 48, className, alt = '', priority, float }: Icon3DProps) {
  return (
    <Image
      src={`/3d/${name}.png`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      priority={priority}
      className={cn('icon-3d', float && 'animate-float', className)}
    />
  );
}

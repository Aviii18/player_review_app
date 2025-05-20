import { cn } from "@/lib/utils";

interface RatingBarProps {
  rating: number;
  label?: string;
  value?: string;
  className?: string;
}

const RatingBar = ({ rating, label, value, className }: RatingBarProps) => {
  const getColor = (rating: number) => {
    if (rating >= 80) return "bg-green-500"; // Success
    if (rating >= 60) return "bg-amber-500"; // Warning
    return "bg-red-500"; // Error
  };

  const getPercentage = () => {
    return `${Math.max(5, Math.min(rating, 100))}%`;
  };

  return (
    <div className={cn("w-full", className)}>
      {(label || value) && (
        <div className="mb-1 flex justify-between text-sm">
          {label && <span>{label}</span>}
          {value && <span className="font-mono">{value}</span>}
        </div>
      )}
      <div className="w-full bg-neutral-100 rounded-full">
        <div 
          className={`h-2 rounded-full ${getColor(rating)}`} 
          style={{ width: getPercentage() }}
        ></div>
      </div>
    </div>
  );
};

export default RatingBar;

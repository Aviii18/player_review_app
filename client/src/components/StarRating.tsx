import { useState } from "react";

interface StarRatingProps {
  initialRating?: number;
  totalStars?: number;
  onChange?: (rating: number) => void;
  className?: string;
  readOnly?: boolean;
}

const StarRating = ({ 
  initialRating = 0, 
  totalStars = 5, 
  onChange,
  className = "",
  readOnly = false
}: StarRatingProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const handleClick = (starIndex: number) => {
    if (readOnly) return;
    const newRating = starIndex + 1;
    setRating(newRating);
    onChange?.(newRating);
  };

  return (
    <div className={`flex ${className}`}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            type="button"
            key={i}
            className={`${
              starValue <= (hover || rating) ? "text-amber-500" : "text-neutral-200"
            } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => handleClick(i)}
            onMouseEnter={() => !readOnly && setHover(starValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
            disabled={readOnly}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;

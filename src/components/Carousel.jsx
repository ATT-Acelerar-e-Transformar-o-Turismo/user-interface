import React, { useState } from "react";

const Carousel = ({ images = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!Array.isArray(images)) {
    return null;
  }

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="carousel w-full">
      {images.map((image, index) => (
        <div
          key={index}
          className={`carousel-item relative w-full aspect-[4/1] overflow-hidden rounded-lg bg-base-200 ${
            index === currentSlide ? "block" : "hidden"
          }`}
        >
          <img src={image} className="w-full h-full object-cover" alt={`Slide ${index}`} />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <button onClick={prevSlide} className="btn btn-circle">
              ❮
            </button>
            <button onClick={nextSlide} className="btn btn-circle">
              ❯
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Carousel;

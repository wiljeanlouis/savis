import { Carousel, CarouselContent, CarouselItem } from "@/shared/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";

export const HomePage = () => {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }),
  );

  return (
    <div className="flex h-screen items-center justify-center bg-gray">
      <div className="flex flex-col">
        <div className="flex items-center justify-center">
          <div className="w-xs">
            <img
              src="/src/assets/savour_et_plus_logo.png"
              alt="logo savouretplus"
            />
          </div>
        </div>
        <p className="text-2xl flex items-center justify-center">
          Bienvenue dans l'espace admin de SAVIS
        </p>

        <Carousel className="size-md" plugins={[plugin.current]}>
          <CarouselContent>
            <CarouselItem>
              <img
                src="/src/assets/decoration-1-530x480.png"
                className="size-md"
              />
            </CarouselItem>
            <CarouselItem>
              <img
                src="/src/assets/decoration-2-530x480.png"
                className="size-md"
              />
            </CarouselItem>
            <CarouselItem>
              <img
                src="/src/assets/decoration-3-530x480.png"
                className="size-md"
              />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

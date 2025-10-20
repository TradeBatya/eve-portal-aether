import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Star particles
    class Star {
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;

      constructor() {
        this.x = Math.random() * canvas.width - canvas.width / 2;
        this.y = Math.random() * canvas.height - canvas.height / 2;
        this.z = Math.random() * 1000;
        this.size = Math.random() * 2;
        this.speed = Math.random() * 0.5 + 0.1;
      }

      update() {
        this.z -= this.speed;
        if (this.z <= 0) {
          this.z = 1000;
          this.x = Math.random() * canvas.width - canvas.width / 2;
          this.y = Math.random() * canvas.height - canvas.height / 2;
        }
      }

      draw() {
        if (!ctx || !canvas) return;
        
        const x = (this.x / this.z) * 200 + canvas.width / 2;
        const y = (this.y / this.z) * 200 + canvas.height / 2;
        const size = (1 - this.z / 1000) * this.size;
        const opacity = (1 - this.z / 1000) * 0.8;

        ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        if (size > 0.5) {
          ctx.fillStyle = `rgba(0, 212, 255, ${opacity * 0.3})`;
          ctx.beginPath();
          ctx.arc(x, y, size * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Create stars
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push(new Star());
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(14, 19, 29, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.update();
        star.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: "linear-gradient(180deg, #0e131d 0%, #1a1f2e 50%, #0e131d 100%)" }}
    />
  );
}

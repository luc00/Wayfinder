import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import desertCactusImg from '../assets/images/amo_desert_cactus_1795686899892.jpg';
import oceanY2kImg from '../assets/images/amo_ocean_y2k_1795686898166.jpg';
import skyPalmsImg from '../assets/images/amo_sky_palms_1795686898659.jpg';
import urbanStreetImg from '../assets/images/amo_urban_street_1795686899882.jpg';

export function CollageBackdrop() {
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, { stiffness: 45, damping: 18, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 45, damping: 18, mass: 0.6 });

  const { scrollY } = useScroll();

  useEffect(() => {
    if (prefersReducedMotion || typeof window === 'undefined') return;

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      const ny = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      pointerX.set(nx);
      pointerY.set(ny);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [prefersReducedMotion, pointerX, pointerY]);

  // Multi-depth mouse & scroll parallax transforms (compositor-only)
  const slowX = useTransform(smoothX, [-1, 1], prefersReducedMotion ? [0, 0] : [-10, 10]);
  const slowY = useTransform(smoothY, [-1, 1], prefersReducedMotion ? [0, 0] : [-8, 8]);
  const medX = useTransform(smoothX, [-1, 1], prefersReducedMotion ? [0, 0] : [-18, 18]);
  const medY = useTransform(smoothY, [-1, 1], prefersReducedMotion ? [0, 0] : [-14, 14]);
  const fastX = useTransform(smoothX, [-1, 1], prefersReducedMotion ? [0, 0] : [22, -22]);
  const fastY = useTransform(smoothY, [-1, 1], prefersReducedMotion ? [0, 0] : [16, -16]);

  const scrollSlow = useTransform(scrollY, [0, 1200], prefersReducedMotion ? [0, 0] : [0, -40]);
  const scrollMed = useTransform(scrollY, [0, 1200], prefersReducedMotion ? [0, 0] : [0, -75]);
  const scrollFast = useTransform(scrollY, [0, 1200], prefersReducedMotion ? [0, 0] : [0, -110]);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* 1. Sfondo continuo cielo azzurro brillante -> estate pop -> Y2K pastel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #1E78FF 0%, #38BDF8 32%, #7DD3FC 58%, #E0F2FE 76%, #FEF3C7 91%, #FCE7F3 100%)',
        }}
      />

      {/* Bagliori solari e nuvolette morbide sul cielo */}
      <div
        className="absolute -top-24 left-[12%] w-[460px] h-[340px] rounded-full blur-3xl opacity-55"
        style={{ background: 'radial-gradient(circle, #FFFFFF 0%, rgba(255,255,255,0) 70%)' }}
      />
      <div
        className="absolute top-[22%] right-[4%] w-[420px] h-[420px] rounded-full blur-3xl opacity-45"
        style={{ background: 'radial-gradient(circle, #FDE047 0%, rgba(253,224,71,0) 70%)' }}
      />
      <div
        className="absolute bottom-[-8%] left-[10%] w-[520px] h-[400px] rounded-full blur-3xl opacity-40"
        style={{ background: 'radial-gradient(circle, #F472B6 0%, rgba(244,114,182,0) 72%)' }}
      />

      {/* Griglia puntinata leggera stile scrapbook */}
      <div className="absolute inset-0 bg-paper-dots opacity-55" />

      {/* 2. MINI-CARD FOTOGRAFICHE INCLINATE & PAESAGGI ESTIVI/URBANI (Layer Profondo) */}
      <motion.div style={{ x: slowX, y: scrollSlow }} className="absolute inset-0">
        {/* Top-Left: Cielo azzurro & palme estive */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, -8, 0], rotate: [-10, -8.2, -10] }
          }
          transition={{ duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="absolute -top-4 -left-10 sm:-left-6 lg:left-3 xl:left-6 w-36 sm:w-44 lg:w-52 rounded-[24px] bg-sky-300 border-[6px] border-white shadow-[0_18px_36px_rgba(0,0,0,0.22)] overflow-hidden"
        >
          <img
            src={skyPalmsImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-44 sm:h-52 lg:h-60 object-cover block"
          />
        </motion.div>

        {/* Top-Right: Oceano turchese & orizzonte estivo */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, 9, 0], rotate: [9, 11, 9] }
          }
          transition={{ duration: 8.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="absolute top-6 -right-10 sm:-right-4 lg:right-4 xl:right-8 w-40 sm:w-48 lg:w-56 rounded-[26px] bg-cyan-300 border-[6px] border-white shadow-[0_18px_38px_rgba(0,0,0,0.22)] overflow-hidden"
        >
          <img
            src={oceanY2kImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-36 sm:h-44 lg:h-48 object-cover block"
          />
        </motion.div>

        {/* Mid-Left: Cactus nel deserto su muro rosa pop */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, 10, 0], rotate: [7, 5.2, 7] }
          }
          transition={{ duration: 8.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="hidden md:block absolute top-[350px] -left-10 lg:left-2 xl:left-5 w-44 lg:w-52 rounded-[22px] bg-pink-200 border-[6px] border-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <img
            src={desertCactusImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-36 lg:h-40 object-cover block"
          />
        </motion.div>

        {/* Mid-Right: Paesaggio urbano estivo pastello e cromo */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, -9, 0], rotate: [-8, -6, -8] }
          }
          transition={{ duration: 7.9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="hidden md:block absolute top-[300px] -right-10 lg:right-2 xl:right-5 w-48 lg:w-56 rounded-[24px] bg-sky-200 border-[6px] border-white shadow-[0_16px_36px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <img
            src={urbanStreetImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-36 lg:h-44 object-cover block"
          />
        </motion.div>

        {/* Bottom-Left: Paesaggio urbano / collage incorniciato */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, -7, 0], rotate: [-6, -4.5, -6] }
          }
          transition={{ duration: 9.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="absolute -bottom-8 -left-8 sm:left-2 xl:left-6 w-40 sm:w-48 lg:w-56 rounded-[24px] bg-amber-100 border-[6px] border-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <img
            src={urbanStreetImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-32 sm:h-36 lg:h-40 object-cover block"
          />
        </motion.div>

        {/* Bottom-Right: Cactus & palme estive sovrapposte */}
        <motion.div
          animate={
            prefersReducedMotion
              ? undefined
              : { y: [0, 8, 0], rotate: [10, 8.5, 10] }
          }
          transition={{ duration: 8.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          className="absolute -bottom-8 -right-8 sm:right-2 xl:right-8 w-40 sm:w-48 lg:w-52 rounded-[24px] bg-emerald-100 border-[6px] border-white shadow-[0_16px_34px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <img
            src={desertCactusImg}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-32 sm:h-36 lg:h-40 object-cover block"
          />
        </motion.div>
      </motion.div>

      {/* 3. STICKER POP, PALME, CACTUS, CD Y2K & HARDWARE (Layer Intermedio) */}
      <motion.div style={{ x: medX, y: medY }} className="absolute inset-0">
        <motion.div style={{ y: scrollMed }} className="relative w-full h-full">
          {/* Sticker Palma pop con bordo bianco spesso (alto sinistra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -6, 0], rotate: [8, 12, 8] }
            }
            transition={{ duration: 6.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden sm:block absolute top-[210px] left-[190px] xl:left-[215px] drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
          >
            <svg width="58" height="62" viewBox="0 0 64 68" fill="none">
              <path
                d="M32 62C31 48 33 34 36 22M36 22C26 16 14 19 8 27C17 26 25 25 36 22ZM36 22C29 10 19 6 11 9C20 13 27 16 36 22ZM36 22C38 10 47 5 55 8C47 13 42 17 36 22ZM36 22C46 16 56 20 60 28C51 26 44 25 36 22Z"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 62C31 48 33 34 36 22"
                stroke="#92400E"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M36 22C26 16 14 19 8 27C17 26 25 25 36 22ZM36 22C29 10 19 6 11 9C20 13 27 16 36 22ZM36 22C38 10 47 5 55 8C47 13 42 17 36 22ZM36 22C46 16 56 20 60 28C51 26 44 25 36 22Z"
                fill="#22C55E"
                stroke="#111111"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Sticker Cactus pop con bordo bianco (basso sinistra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, 7, 0], rotate: [-12, -8, -12] }
            }
            transition={{ duration: 6.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden lg:block absolute bottom-44 left-12 xl:left-24 drop-shadow-[0_10px_18px_rgba(0,0,0,0.2)]"
          >
            <svg width="56" height="68" viewBox="0 0 56 68" fill="none">
              <path
                d="M28 60V14C28 10 24 8 22 10V32H15C12 32 10 30 10 26V22M28 38H39C42 38 44 36 44 32V24"
                stroke="#FFFFFF"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28 60V14C28 10 24 8 22 10V32H15C12 32 10 30 10 26V22M28 38H39C42 38 44 36 44 32V24"
                stroke="#16A34A"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M28 60V14C28 10 24 8 22 10V32H15C12 32 10 30 10 26V22M28 38H39C42 38 44 36 44 32V24"
                stroke="#111111"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="25" cy="8" r="4" fill="#F43F5E" stroke="#111111" strokeWidth="1.5" />
            </svg>
          </motion.div>

          {/* Sticker hardware retrò stile Teenage Engineering TP-7 */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -7, 0], rotate: [-7, -4.5, -7] }
            }
            transition={{ duration: 7.1, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:block absolute top-[265px] left-6 2xl:left-12 w-28 2xl:w-32 rounded-2xl bg-[#E4E4E7] border-4 border-white shadow-[0_12px_24px_rgba(0,0,0,0.2)] p-2"
          >
            <div className="rounded-xl border border-black/15 bg-[#F4F4F5] p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-2 h-2 rounded-full bg-[#F97316] border border-black/30" />
                <span className="font-mono text-[8px] font-bold text-[#111111] tracking-wider">
                  TP-07 · AI
                </span>
              </div>
              <div className="w-10 h-10 mx-auto rounded-full bg-white border-2 border-black/20 flex items-center justify-center shadow-inner">
                <div className="w-3.5 h-3.5 rounded-full bg-[#111111]" />
              </div>
              <div className="flex justify-between font-mono text-[8px] text-zinc-600 tabular-nums">
                <span>CTX</span>
                <span className="font-bold text-[#111111]">12.4%</span>
              </div>
            </div>
          </motion.div>

          {/* Mini-card sticker gialla inclinata con bordo bianco spesso */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, 8, 0], rotate: [8, 10.5, 8] }
            }
            transition={{ duration: 6.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:block absolute top-[220px] right-8 2xl:right-14 w-32 rounded-2xl bg-[#FACC15] border-4 border-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] p-2.5 text-[#111111]"
          >
            <div className="font-mono text-[9px] font-bold uppercase tracking-wider">
              NO CONTEXT ROT
            </div>
            <div className="font-hand text-2xl font-bold leading-none mt-1">
              fresh chat!
            </div>
            <div className="mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#111111]" />
              <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
            </div>
          </motion.div>

          {/* Disco Y2K olografico + smiley pop (destra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -8, 0], rotate: [0, 18, 0] }
            }
            transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden lg:flex items-center justify-center absolute bottom-[230px] right-8 xl:right-16 w-16 h-16 rounded-full border-4 border-white shadow-[0_12px_24px_rgba(0,0,0,0.2)]"
            style={{
              background:
                'conic-gradient(from 40deg, #F472B6, #FACC15, #4ADE80, #38BDF8, #C084FC, #F472B6)',
            }}
          >
            <div className="w-5 h-5 rounded-full bg-white border-2 border-[#111111]" />
          </motion.div>

          {/* Nuvola pixel-art "1 CHAT!" (basso sinistra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -6, 0], rotate: [5, 8, 5] }
            }
            transition={{ duration: 6.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:block absolute bottom-32 left-20"
          >
            <svg
              width="86"
              height="50"
              viewBox="0 0 88 52"
              className="drop-shadow-[3px_4px_0px_rgba(0,0,0,0.16)]"
            >
              <path
                d="M16 40H70C77 40 82 35 82 28C82 22 77 17 71 17C69 9 62 4 53 4C44 4 37 10 35 18C32 16 29 15 25 15C16 15 10 21 10 29C10 35 12 40 16 40Z"
                fill="#FFFFFF"
                stroke="#111111"
                strokeWidth="2.5"
              />
              <text
                x="24"
                y="29"
                fill="#111111"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                1 CHAT!
              </text>
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 4. CURSORE GIGANTE & SCARABOCCHI A MANO LIBERA (Layer Primo Piano Parallasse) */}
      <motion.div style={{ x: fastX, y: fastY }} className="absolute inset-0">
        <motion.div style={{ y: scrollFast }} className="relative w-full h-full">
          {/* Cursore bianco grande con bordo nero (visibile da sm+) */}
          <motion.svg
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -9, 0], x: [0, 5, 0], rotate: [-12, -7, -12] }
            }
            transition={{ duration: 5.8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            width="62"
            height="76"
            viewBox="0 0 24 30"
            className="hidden sm:block absolute top-24 left-10 xl:left-24 drop-shadow-[5px_7px_0px_rgba(0,0,0,0.28)]"
          >
            <path
              d="M2 2V24L7.5 18.5L11.5 27.5L15 26L11 17H19L2 2Z"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="2"
              strokeLinejoin="miter"
            />
          </motion.svg>

          {/* Annotazione pennarello "SAFE ZONE!" + freccia curva nel cielo libero */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, 5, 0], rotate: [-5, -2, -5] }
            }
            transition={{ duration: 6.9, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:block absolute top-[132px] left-[220px] text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.42)]"
          >
            <span className="font-hand text-3xl font-bold tracking-wide block">
              SAFE ZONE!
            </span>
            <svg width="58" height="34" viewBox="0 0 64 36" fill="none" className="ml-5 -mt-1">
              <path
                d="M4 4C18 22 36 26 56 18M56 18L47 12M56 18L49 27"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Annotazione pennarello "LOOK UP!" + stelletta + freccia (alto destra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -6, 0], rotate: [7, 10, 7] }
            }
            transition={{ duration: 6.1, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden sm:flex items-center gap-1.5 absolute top-24 right-8 xl:right-20 text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.38)]"
          >
            <span className="font-hand text-2xl sm:text-3xl font-bold tracking-wide">
              LOOK UP!
            </span>
            <svg width="26" height="26" viewBox="0 0 24 24" className="-mt-1">
              <path
                d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
                fill="#FACC15"
                stroke="#111111"
                strokeWidth="1.8"
              />
            </svg>
          </motion.div>

          {/* Cuore + stelletta scarabocchiati (sinistra) */}
          <motion.svg
            animate={
              prefersReducedMotion
                ? undefined
                : { scale: [1, 1.08, 1], rotate: [-8, 4, -8] }
            }
            transition={{ duration: 5.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            width="36"
            height="36"
            viewBox="0 0 24 24"
            className="hidden xl:block absolute top-[535px] left-12 drop-shadow-[2px_3px_0px_rgba(0,0,0,0.2)]"
          >
            <path
              d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2.2 0 4 1.2 5 3 1-1.8 2.8-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"
              fill="#F43F5E"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
          </motion.svg>

          {/* Sticker cuore + scritta "FRIENDS!" (basso destra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, 6, 0], rotate: [-6, -3, -6] }
            }
            transition={{ duration: 6.7, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:flex items-center gap-1.5 absolute bottom-36 right-8 2xl:right-14 rounded-full bg-white border-2 border-[#111111] px-4 py-1.5 shadow-[4px_4px_0px_#111111]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#EC4899" stroke="#111111" strokeWidth="2">
              <path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2.2 0 4 1.2 5 3 1-1.8 2.8-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z" />
            </svg>
            <span className="font-hand text-xl font-bold text-[#111111]">FRIENDS!</span>
          </motion.div>

          {/* Badge vinilico pop viola (basso destra) */}
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -5, 0], rotate: [11, 14, 11] }
            }
            transition={{ duration: 7.4, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="hidden xl:block absolute bottom-16 right-16 rounded-2xl bg-[#A855F7] text-white border-4 border-white px-3.5 py-1.5 shadow-[0_12px_24px_rgba(0,0,0,0.2)]"
          >
            <span className="font-mono text-[11px] font-bold tracking-wide">MAP · v1</span>
          </motion.div>

          {/* Stelline pop sparse ai bordi */}
          <motion.svg
            animate={
              prefersReducedMotion
                ? undefined
                : { rotate: [0, 25, 0], scale: [1, 1.12, 1] }
            }
            transition={{ duration: 5.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            className="hidden sm:block absolute top-[480px] right-10 xl:right-20 drop-shadow-[2px_3px_0px_rgba(0,0,0,0.2)]"
          >
            <path
              d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
              fill="#FDE047"
              stroke="#111111"
              strokeWidth="1.8"
            />
          </motion.svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

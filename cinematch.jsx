import { useState, useEffect, useRef } from "react";

const MOVIES = [
  { title: "Everything Everywhere All at Once", year: 2022, genre: "Sci-Fi / Drama", hedonic: 0.6, arousal: 0.8, moralFlex: 0.7, literacy: 0.7, social: 0.6, mood: { sad: 0.8, anxious: 0.5, restless: 0.7, reflective: 0.6, joyful: 0.7, numb: 0.8 }, tagline: "Multiverse chaos meets mother-daughter tenderness", why: "Balances high-energy spectacle with genuine emotional depth — works whether you want stimulation or catharsis." },
  { title: "The Shawshank Redemption", year: 1994, genre: "Drama", hedonic: 0.5, arousal: 0.4, moralFlex: 0.3, literacy: 0.3, social: 0.7, mood: { sad: 0.7, anxious: 0.3, restless: 0.3, reflective: 0.8, joyful: 0.5, numb: 0.7 }, tagline: "Hope as a quiet act of defiance", why: "Slow-burn emotional payoff. High moral clarity with a protagonist you root for unconditionally." },
  { title: "Parasite", year: 2019, genre: "Thriller / Dark Comedy", hedonic: 0.6, arousal: 0.7, moralFlex: 0.9, literacy: 0.8, social: 0.6, mood: { sad: 0.4, anxious: 0.6, restless: 0.7, reflective: 0.9, joyful: 0.3, numb: 0.6 }, tagline: "Class warfare as genre-bending cinema", why: "Rewards moral ambiguity tolerance — no clean heroes. High cognitive challenge with thriller pacing." },
  { title: "Mad Max: Fury Road", year: 2015, genre: "Action", hedonic: 0.9, arousal: 0.95, moralFlex: 0.3, literacy: 0.5, social: 0.8, mood: { sad: 0.3, anxious: 0.4, restless: 0.9, reflective: 0.2, joyful: 0.7, numb: 0.8 }, tagline: "Pure kinetic cinema as catharsis", why: "Maximum arousal, clear moral stakes. When you need to feel alive without thinking too hard." },
  { title: "Eternal Sunshine of the Spotless Mind", year: 2004, genre: "Sci-Fi / Romance", hedonic: 0.4, arousal: 0.4, moralFlex: 0.6, literacy: 0.7, social: 0.4, mood: { sad: 0.9, anxious: 0.5, restless: 0.3, reflective: 0.9, joyful: 0.3, numb: 0.7 }, tagline: "Memory, loss, and choosing love anyway", why: "Eudaimonic core — it won't cheer you up, but it'll make sadness feel meaningful." },
  { title: "The Grand Budapest Hotel", year: 2014, genre: "Comedy / Drama", hedonic: 0.8, arousal: 0.5, moralFlex: 0.4, literacy: 0.8, social: 0.7, mood: { sad: 0.5, anxious: 0.3, restless: 0.5, reflective: 0.6, joyful: 0.8, numb: 0.5 }, tagline: "Whimsy as a shield against melancholy", why: "High aesthetic pleasure with emotional undertow. Rewards film literacy through visual composition." },
  { title: "No Country for Old Men", year: 2007, genre: "Thriller", hedonic: 0.3, arousal: 0.7, moralFlex: 0.9, literacy: 0.8, social: 0.3, mood: { sad: 0.5, anxious: 0.7, restless: 0.6, reflective: 0.8, joyful: 0.1, numb: 0.6 }, tagline: "Violence without catharsis, fate without mercy", why: "Demands high moral flexibility — the villain wins, meaning is absent. Pure eudaimonic challenge." },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "Animation / Action", hedonic: 0.9, arousal: 0.7, moralFlex: 0.2, literacy: 0.4, social: 0.9, mood: { sad: 0.5, anxious: 0.3, restless: 0.7, reflective: 0.3, joyful: 0.9, numb: 0.7 }, tagline: "Anyone can wear the mask", why: "Pure hedonic joy with clear moral stakes. Low barrier, maximum emotional payoff." },
  { title: "Mulholland Drive", year: 2001, genre: "Mystery / Surreal", hedonic: 0.2, arousal: 0.6, moralFlex: 0.8, literacy: 0.95, social: 0.1, mood: { sad: 0.6, anxious: 0.7, restless: 0.4, reflective: 0.9, joyful: 0.1, numb: 0.5 }, tagline: "A dream that refuses to explain itself", why: "Maximum film literacy demand. No hand-holding, no clean resolution. A puzzle film for solitary viewing." },
  { title: "The Dark Knight", year: 2008, genre: "Action / Thriller", hedonic: 0.7, arousal: 0.8, moralFlex: 0.7, literacy: 0.5, social: 0.8, mood: { sad: 0.4, anxious: 0.5, restless: 0.8, reflective: 0.5, joyful: 0.5, numb: 0.6 }, tagline: "Chaos as philosophy, action as argument", why: "Bridges hedonic and eudaimonic — exciting enough to enjoy, deep enough to chew on." },
  { title: "Moonlight", year: 2016, genre: "Drama", hedonic: 0.2, arousal: 0.3, moralFlex: 0.5, literacy: 0.7, social: 0.2, mood: { sad: 0.8, anxious: 0.4, restless: 0.2, reflective: 0.95, joyful: 0.2, numb: 0.8 }, tagline: "Identity forged in silence and tenderness", why: "Deep eudaimonic experience. Quiet, contemplative, rewards patience. Best experienced alone." },
  { title: "The Big Lebowski", year: 1998, genre: "Comedy", hedonic: 0.9, arousal: 0.4, moralFlex: 0.5, literacy: 0.6, social: 0.9, mood: { sad: 0.3, anxious: 0.2, restless: 0.4, reflective: 0.2, joyful: 0.8, numb: 0.6 }, tagline: "The Dude abides, and that's enough", why: "Maximum hedonic comfort. Low stakes, absurdist humor, zero emotional challenge." },
  { title: "Arrival", year: 2016, genre: "Sci-Fi / Drama", hedonic: 0.3, arousal: 0.4, moralFlex: 0.5, literacy: 0.7, social: 0.4, mood: { sad: 0.8, anxious: 0.5, restless: 0.2, reflective: 0.95, joyful: 0.3, numb: 0.7 }, tagline: "Language as the shape of time", why: "Cerebral sci-fi that rewards reflection. The emotional payload is delayed but devastating." },
  { title: "John Wick", year: 2014, genre: "Action", hedonic: 0.9, arousal: 0.9, moralFlex: 0.4, literacy: 0.3, social: 0.8, mood: { sad: 0.3, anxious: 0.3, restless: 0.9, reflective: 0.1, joyful: 0.6, numb: 0.8 }, tagline: "Grief expressed through choreographed violence", why: "Pure arousal-regulation film. When you need kinetic energy and simple moral stakes." },
  { title: "In the Mood for Love", year: 2000, genre: "Romance / Drama", hedonic: 0.2, arousal: 0.2, moralFlex: 0.4, literacy: 0.9, social: 0.2, mood: { sad: 0.9, anxious: 0.3, restless: 0.1, reflective: 0.95, joyful: 0.2, numb: 0.6 }, tagline: "Desire held at arm's length, beautifully", why: "Maximum eudaimonic, minimum arousal. A film about restraint that demands patience and rewards attention to composition." },
  { title: "Get Out", year: 2017, genre: "Horror / Thriller", hedonic: 0.6, arousal: 0.8, moralFlex: 0.6, literacy: 0.6, social: 0.7, mood: { sad: 0.3, anxious: 0.7, restless: 0.7, reflective: 0.7, joyful: 0.3, numb: 0.6 }, tagline: "Social horror that thinks while it scares", why: "Bridges horror-as-sensation with horror-as-commentary. High arousal with genuine thematic depth." },
  { title: "The Truman Show", year: 1998, genre: "Drama / Sci-Fi", hedonic: 0.6, arousal: 0.4, moralFlex: 0.4, literacy: 0.5, social: 0.6, mood: { sad: 0.6, anxious: 0.6, restless: 0.5, reflective: 0.8, joyful: 0.4, numb: 0.7 }, tagline: "What if your whole life was the performance?", why: "Accessible eudaimonic film — doesn't require high film literacy but rewards reflection on authenticity and freedom." },
  { title: "Whiplash", year: 2014, genre: "Drama / Music", hedonic: 0.6, arousal: 0.8, moralFlex: 0.7, literacy: 0.5, social: 0.5, mood: { sad: 0.4, anxious: 0.8, restless: 0.7, reflective: 0.6, joyful: 0.4, numb: 0.7 }, tagline: "Obsession as both fuel and fire", why: "Channels anxious energy into narrative tension. Morally complex mentor-student dynamic with a visceral payoff." },
  { title: "Amélie", year: 2001, genre: "Romance / Comedy", hedonic: 0.85, arousal: 0.4, moralFlex: 0.2, literacy: 0.6, social: 0.6, mood: { sad: 0.6, anxious: 0.2, restless: 0.3, reflective: 0.5, joyful: 0.9, numb: 0.7 }, tagline: "Small kindnesses rendered in candy colors", why: "Hedonic warmth with gentle eudaimonic undertones. A film that believes in goodness without being naive about loneliness." },
  { title: "There Will Be Blood", year: 2007, genre: "Drama", hedonic: 0.2, arousal: 0.6, moralFlex: 0.9, literacy: 0.8, social: 0.2, mood: { sad: 0.5, anxious: 0.5, restless: 0.5, reflective: 0.8, joyful: 0.1, numb: 0.5 }, tagline: "Ambition as a form of madness", why: "Anti-hero study with zero moral safety net. Demands tolerance for sustained darkness and slow-burn pacing." },
  { title: "Spirited Away", year: 2001, genre: "Animation / Fantasy", hedonic: 0.7, arousal: 0.5, moralFlex: 0.4, literacy: 0.5, social: 0.7, mood: { sad: 0.6, anxious: 0.4, restless: 0.4, reflective: 0.7, joyful: 0.7, numb: 0.8 }, tagline: "Growing up as a journey through a spirit world", why: "Bridges hedonic beauty with eudaimonic depth. Works across mood states — comforting but not trivial." },
  { title: "Hereditary", year: 2018, genre: "Horror", hedonic: 0.2, arousal: 0.9, moralFlex: 0.7, literacy: 0.7, social: 0.4, mood: { sad: 0.5, anxious: 0.3, restless: 0.6, reflective: 0.5, joyful: 0.1, numb: 0.4 }, tagline: "Grief mutating into something monstrous", why: "High arousal, high moral ambiguity. Not for anxious states — this film amplifies dread, not releases it." },
  { title: "Before Sunrise", year: 1995, genre: "Romance / Drama", hedonic: 0.6, arousal: 0.2, moralFlex: 0.3, literacy: 0.6, social: 0.5, mood: { sad: 0.6, anxious: 0.2, restless: 0.2, reflective: 0.8, joyful: 0.6, numb: 0.6 }, tagline: "One night of conversation as a love story", why: "Low arousal, high meaning. A film about connection that works when you're craving genuine human warmth." },
  { title: "Superbad", year: 2007, genre: "Comedy", hedonic: 0.95, arousal: 0.6, moralFlex: 0.3, literacy: 0.2, social: 0.95, mood: { sad: 0.3, anxious: 0.2, restless: 0.6, reflective: 0.1, joyful: 0.8, numb: 0.6 }, tagline: "Friendship as the real coming-of-age", why: "Pure hedonic release with zero cognitive demand. Best with friends, best when you just need to laugh." },
  { title: "Drive", year: 2011, genre: "Thriller / Drama", hedonic: 0.5, arousal: 0.7, moralFlex: 0.7, literacy: 0.7, social: 0.3, mood: { sad: 0.5, anxious: 0.5, restless: 0.6, reflective: 0.6, joyful: 0.2, numb: 0.7 }, tagline: "Violence and tenderness in the same frame", why: "Stylish, deliberate pacing with eruptions of intensity. Rewards viewers who read atmosphere as narrative." },
  { title: "Inside Out", year: 2015, genre: "Animation / Drama", hedonic: 0.7, arousal: 0.4, moralFlex: 0.3, literacy: 0.3, social: 0.8, mood: { sad: 0.8, anxious: 0.4, restless: 0.3, reflective: 0.7, joyful: 0.6, numb: 0.8 }, tagline: "It's okay to not be okay", why: "Validates sadness while being genuinely entertaining. Accessible emotional intelligence in animated form." },
  { title: "The Lighthouse", year: 2019, genre: "Horror / Drama", hedonic: 0.1, arousal: 0.7, moralFlex: 0.9, literacy: 0.95, social: 0.1, mood: { sad: 0.4, anxious: 0.5, restless: 0.5, reflective: 0.7, joyful: 0.1, numb: 0.5 }, tagline: "Madness in black and white, at sea", why: "Maximum film literacy demand. Mythic, claustrophobic, deliberately hostile to casual viewing." },
  { title: "Lady Bird", year: 2017, genre: "Comedy / Drama", hedonic: 0.7, arousal: 0.3, moralFlex: 0.4, literacy: 0.5, social: 0.6, mood: { sad: 0.6, anxious: 0.3, restless: 0.3, reflective: 0.7, joyful: 0.6, numb: 0.6 }, tagline: "Home is the place you keep leaving", why: "Warm, character-driven, emotionally honest. Bridges hedonic charm with genuine coming-of-age reflection." },
  { title: "Interstellar", year: 2014, genre: "Sci-Fi / Drama", hedonic: 0.6, arousal: 0.7, moralFlex: 0.4, literacy: 0.5, social: 0.7, mood: { sad: 0.7, anxious: 0.5, restless: 0.5, reflective: 0.8, joyful: 0.5, numb: 0.7 }, tagline: "Love as a force that transcends spacetime", why: "Spectacle paired with emotional stakes. Accessible eudaimonic sci-fi that doesn't sacrifice feeling for ideas." },
  { title: "Knives Out", year: 2019, genre: "Mystery / Comedy", hedonic: 0.85, arousal: 0.6, moralFlex: 0.5, literacy: 0.5, social: 0.9, mood: { sad: 0.3, anxious: 0.3, restless: 0.6, reflective: 0.4, joyful: 0.7, numb: 0.6 }, tagline: "A whodunit that knows exactly what it's doing", why: "High hedonic enjoyment with enough narrative complexity to stay engaging. Great social watch." },
];

const QUESTIONS = [
  {
    axis: "hedonic",
    label: "Why do you watch movies?",
    description: "Hedonic ↔ Eudaimonic Motivation",
    research: "Oliver & Raney (2011) — hedonic motivation predicts preference for action/comedy; eudaimonic predicts drama and cognitive elaboration during viewing.",
    options: [
      { label: "To feel good — fun, escape, pleasure", value: 0.85, emoji: "🍿" },
      { label: "A bit of both, leaning toward fun", value: 0.65, emoji: "🎬" },
      { label: "A bit of both, leaning toward meaning", value: 0.4, emoji: "🎭" },
      { label: "To think, reflect, or feel something real", value: 0.2, emoji: "💭" },
    ],
  },
  {
    axis: "arousal",
    label: "How much intensity do you want right now?",
    description: "Arousal Tolerance / Sensation Seeking",
    research: "Zuckerman (1994), Banerjee et al. (2008) — sensation seeking predicts preference for high-arousal genres. Bartsch & Hartmann (2017) showed challenge perception is viewer-dependent.",
    options: [
      { label: "Crank it up — I want to feel alive", value: 0.9, emoji: "⚡" },
      { label: "Some tension is good, but not relentless", value: 0.65, emoji: "🌊" },
      { label: "Moderate — engaging but not overwhelming", value: 0.45, emoji: "🌤️" },
      { label: "Calm and quiet — I want to settle in", value: 0.2, emoji: "🕯️" },
    ],
  },
  {
    axis: "moralFlex",
    label: "How do you feel about morally grey characters?",
    description: "Moral Schema Flexibility",
    research: "Zillmann's Affective Disposition Theory — enjoyment depends on moral evaluation of characters. Raney (2004) extended this: viewers with flexible schemas enjoy antihero narratives more.",
    options: [
      { label: "Love them — give me the messy humans", value: 0.85, emoji: "🐺" },
      { label: "Fine with complexity, but I need someone to root for", value: 0.6, emoji: "⚖️" },
      { label: "Prefer clear stakes — I want to know who's good", value: 0.35, emoji: "🛡️" },
      { label: "I need a hero I can believe in", value: 0.15, emoji: "✨" },
    ],
  },
  {
    axis: "literacy",
    label: "How adventurous are you with film?",
    description: "Film Literacy / Schema Sophistication",
    research: "Bordwell (1985) — experienced viewers develop richer narrative schemas. Cognitive Film Theory posits spectatorship as active, hypothesis-driven processing modulated by exposure.",
    options: [
      { label: "I watch everything — art house, foreign, experimental", value: 0.9, emoji: "🎥" },
      { label: "I appreciate craft but don't seek out obscure stuff", value: 0.65, emoji: "📽️" },
      { label: "I know what I like — mostly mainstream but open", value: 0.4, emoji: "🍿" },
      { label: "Keep it accessible — no subtitles tonight", value: 0.2, emoji: "📺" },
    ],
  },
  {
    axis: "social",
    label: "Who's watching with you?",
    description: "Social vs. Solitary Viewing Function",
    research: "Uses & Gratifications Theory — social viewing shifts preferences toward shared-experience films with broader appeal. Solitary viewing allows for more challenging, personal content.",
    options: [
      { label: "Group watch — needs to work for everyone", value: 0.9, emoji: "👥" },
      { label: "With one other person", value: 0.6, emoji: "👫" },
      { label: "Solo but want something sociable in tone", value: 0.45, emoji: "🛋️" },
      { label: "Just me — go deep", value: 0.15, emoji: "🎧" },
    ],
  },
];

const MOODS = [
  { label: "Sad or melancholic", key: "sad", emoji: "🌧️", color: "#6B8DAE" },
  { label: "Anxious or restless mind", key: "anxious", emoji: "💫", color: "#C4956A" },
  { label: "Physically restless / need energy", key: "restless", emoji: "🔥", color: "#D4654A" },
  { label: "Reflective / contemplative", key: "reflective", emoji: "🌙", color: "#8B7EC8" },
  { label: "Happy / want to sustain it", key: "joyful", emoji: "☀️", color: "#D4A843" },
  { label: "Numb / want to feel something", key: "numb", emoji: "🫥", color: "#7A8B8B" },
];

function scoreMovie(movie, answers, moodKey) {
  const axisDist =
    Math.abs(movie.hedonic - answers.hedonic) * 1.3 +
    Math.abs(movie.arousal - answers.arousal) * 1.2 +
    Math.abs(movie.moralFlex - answers.moralFlex) * 1.0 +
    Math.abs(movie.literacy - answers.literacy) * 0.9 +
    Math.abs(movie.social - answers.social) * 0.8;
  const moodBonus = movie.mood[moodKey] || 0.5;
  const score = moodBonus * 1.5 - axisDist;
  return score;
}

function getRecommendations(answers, moodKey) {
  const scored = MOVIES.map((m) => ({ ...m, score: scoreMovie(m, answers, moodKey) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

function getAxisExplanation(movie, answers) {
  const parts = [];
  const hDiff = movie.hedonic - answers.hedonic;
  if (Math.abs(hDiff) < 0.25) parts.push("matches your hedonic/eudaimonic balance");
  else if (hDiff > 0) parts.push("leans slightly more hedonic than your profile");
  else parts.push("leans more eudaimonic than your profile");

  if (Math.abs(movie.arousal - answers.arousal) < 0.2) parts.push("intensity level aligns well");
  if (Math.abs(movie.moralFlex - answers.moralFlex) < 0.25) parts.push("moral complexity fits your tolerance");
  if (Math.abs(movie.literacy - answers.literacy) < 0.25) parts.push("film-literacy match");
  if (Math.abs(movie.social - answers.social) < 0.3) parts.push("good for your viewing context");
  return parts.slice(0, 3).join(" · ");
}

export default function CineMatch() {
  const [step, setStep] = useState(0); // 0-4 = questions, 5 = mood, 6 = results
  const [answers, setAnswers] = useState({});
  const [moodKey, setMoodKey] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const containerRef = useRef(null);

  const transition = (next) => {
    setFadeIn(false);
    setTimeout(() => {
      next();
      setFadeIn(true);
    }, 300);
  };

  const handleAnswer = (axis, value) => {
    setSelected(value);
    setTimeout(() => {
      transition(() => {
        setAnswers((a) => ({ ...a, [axis]: value }));
        setStep((s) => s + 1);
        setSelected(null);
      });
    }, 350);
  };

  const handleMood = (key) => {
    setMoodKey(key);
    setTimeout(() => {
      transition(() => setStep(6));
    }, 350);
  };

  const reset = () => {
    transition(() => {
      setStep(0);
      setAnswers({});
      setMoodKey(null);
      setSelected(null);
    });
  };

  const recommendations = step === 6 ? getRecommendations(answers, moodKey) : [];
  const progress = Math.min(step, 6) / 6;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0D0D0D 0%, #1A1510 40%, #0D0D0D 100%)",
      color: "#E8E0D4",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
      overflow: "hidden",
    }}>
      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.5,
      }} />

      {/* Header */}
      <div style={{
        width: "100%", padding: "28px 32px 20px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(212, 168, 67, 0.1)",
      }}>
        <div>
          <h1 style={{
            fontSize: "22px", fontWeight: 400, margin: 0,
            letterSpacing: "3px", textTransform: "uppercase",
            color: "#D4A843",
            fontFamily: "'Courier New', monospace",
          }}>CineMatch</h1>
          <p style={{
            fontSize: "11px", margin: "4px 0 0", color: "#8A7E6E",
            letterSpacing: "1.5px", textTransform: "uppercase",
            fontFamily: "'Courier New', monospace",
          }}>Psychologically-grounded film recommendation</p>
        </div>
        {step > 0 && step < 6 && (
          <button onClick={reset} style={{
            background: "none", border: "1px solid rgba(212, 168, 67, 0.3)",
            color: "#8A7E6E", padding: "6px 14px", cursor: "pointer",
            fontSize: "11px", letterSpacing: "1px", fontFamily: "'Courier New', monospace",
          }}>RESTART</button>
        )}
      </div>

      {/* Progress */}
      <div style={{ width: "100%", height: "2px", background: "rgba(212, 168, 67, 0.08)" }}>
        <div style={{
          height: "100%", width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #D4A843, #C4956A)",
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Content */}
      <div ref={containerRef} style={{
        flex: 1, width: "100%", maxWidth: 640, padding: "40px 24px",
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}>

        {/* Intro */}
        {step === 0 && !answers.hedonic && Object.keys(answers).length === 0 && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{
              fontSize: "14px", color: "#8A7E6E", lineHeight: 1.7,
              maxWidth: 480, margin: "0 auto 32px",
              fontFamily: "'Courier New', monospace",
            }}>
              5 questions grounded in personality psychology, media motivation theory,
              and cognitive film studies. Then your current emotional state.
              Then: films matched to <em style={{ color: "#C4956A" }}>who you are right now</em>.
            </p>
          </div>
        )}

        {/* Questions */}
        {step < 5 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: "11px", color: "#D4A843", letterSpacing: "2px",
                fontFamily: "'Courier New', monospace",
                textTransform: "uppercase",
              }}>
                Axis {step + 1} of 5 — {QUESTIONS[step].description}
              </span>
            </div>
            <h2 style={{
              fontSize: "28px", fontWeight: 400, margin: "12px 0 24px",
              lineHeight: 1.3, color: "#E8E0D4",
            }}>
              {QUESTIONS[step].label}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {QUESTIONS[step].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(QUESTIONS[step].axis, opt.value)}
                  style={{
                    background: selected === opt.value
                      ? "rgba(212, 168, 67, 0.15)"
                      : "rgba(255,255,255,0.03)",
                    border: selected === opt.value
                      ? "1px solid rgba(212, 168, 67, 0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    padding: "16px 20px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#E8E0D4",
                    fontSize: "15px",
                    fontFamily: "'Georgia', serif",
                    lineHeight: 1.4,
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                  onMouseEnter={(e) => {
                    if (selected !== opt.value) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.borderColor = "rgba(212, 168, 67, 0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected !== opt.value) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 28, padding: "14px 18px",
              background: "rgba(139, 126, 200, 0.06)",
              border: "1px solid rgba(139, 126, 200, 0.12)",
              borderRadius: 6,
            }}>
              <p style={{
                fontSize: "11px", color: "#8B7EC8", margin: 0,
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.5px", lineHeight: 1.6,
              }}>
                📑 {QUESTIONS[step].research}
              </p>
            </div>
          </div>
        )}

        {/* Mood */}
        {step === 5 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: "11px", color: "#D4A843", letterSpacing: "2px",
                fontFamily: "'Courier New', monospace",
                textTransform: "uppercase",
              }}>
                Current State — Emotional Context
              </span>
            </div>
            <h2 style={{
              fontSize: "28px", fontWeight: 400, margin: "12px 0 8px",
              lineHeight: 1.3, color: "#E8E0D4",
            }}>
              How are you feeling right now?
            </h2>
            <p style={{
              fontSize: "14px", color: "#8A7E6E", margin: "0 0 28px",
              fontFamily: "'Courier New', monospace",
            }}>
              This calibrates mood-regulation — some films match your state, others shift it.
            </p>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}>
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => handleMood(m.key)}
                  style={{
                    background: moodKey === m.key
                      ? `rgba(${parseInt(m.color.slice(1,3),16)},${parseInt(m.color.slice(3,5),16)},${parseInt(m.color.slice(5,7),16)},0.15)`
                      : "rgba(255,255,255,0.03)",
                    border: `1px solid ${moodKey === m.key ? m.color + "66" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8,
                    padding: "18px 16px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#E8E0D4",
                    fontSize: "14px",
                    fontFamily: "'Georgia', serif",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    if (moodKey !== m.key) {
                      e.currentTarget.style.borderColor = m.color + "44";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (moodKey !== m.key) {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 28, padding: "14px 18px",
              background: "rgba(139, 126, 200, 0.06)",
              border: "1px solid rgba(139, 126, 200, 0.12)",
              borderRadius: 6,
            }}>
              <p style={{
                fontSize: "11px", color: "#8B7EC8", margin: 0,
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.5px", lineHeight: 1.6,
              }}>
                📑 Mood Management Theory (Zillmann, 1988) — viewers select media to regulate emotional states. But Oliver & Raney showed this is incomplete: sometimes we seek media that <em>deepens</em> our current state rather than correcting it.
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 6 && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: "11px", color: "#D4A843", letterSpacing: "2px",
                fontFamily: "'Courier New', monospace",
                textTransform: "uppercase",
              }}>
                Your Recommendations
              </span>
            </div>
            <h2 style={{
              fontSize: "28px", fontWeight: 400, margin: "12px 0 8px",
              lineHeight: 1.3, color: "#E8E0D4",
            }}>
              Here's what the model suggests
            </h2>
            <p style={{
              fontSize: "13px", color: "#8A7E6E", margin: "0 0 32px",
              fontFamily: "'Courier New', monospace", lineHeight: 1.6,
            }}>
              Ranked by weighted distance across your 5-axis profile × mood compatibility.
              Each card shows <em style={{ color: "#C4956A" }}>why</em> this film was selected.
            </p>

            {/* Profile summary */}
            <div style={{
              padding: "16px 20px", marginBottom: 28,
              background: "rgba(212, 168, 67, 0.06)",
              border: "1px solid rgba(212, 168, 67, 0.12)",
              borderRadius: 8,
            }}>
              <p style={{
                fontSize: "11px", color: "#D4A843", margin: "0 0 10px",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "1.5px", textTransform: "uppercase",
              }}>Your Profile</p>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "8px 16px",
                fontSize: "13px", fontFamily: "'Courier New', monospace",
                color: "#C4B89A",
              }}>
                {Object.entries(answers).map(([k, v]) => (
                  <span key={k}>
                    <span style={{ color: "#8A7E6E" }}>{k}:</span>{" "}
                    <span style={{ color: v > 0.6 ? "#D4A843" : v < 0.35 ? "#8B7EC8" : "#C4B89A" }}>
                      {v.toFixed(2)}
                    </span>
                  </span>
                ))}
                <span>
                  <span style={{ color: "#8A7E6E" }}>mood:</span>{" "}
                  <span style={{ color: "#C4956A" }}>{moodKey}</span>
                </span>
              </div>
            </div>

            {/* Movie cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {recommendations.map((movie, i) => (
                <div
                  key={movie.title}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "24px",
                    animation: `fadeSlideIn 0.4s ease ${i * 0.1}s both`,
                  }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 8,
                  }}>
                    <div>
                      <span style={{
                        fontSize: "12px", color: "#D4A843",
                        fontFamily: "'Courier New', monospace",
                        fontWeight: "bold",
                      }}>#{i + 1}</span>
                      <h3 style={{
                        fontSize: "20px", fontWeight: 400, margin: "4px 0 0",
                        color: "#E8E0D4",
                      }}>
                        {movie.title}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: "12px", color: "#8A7E6E",
                      fontFamily: "'Courier New', monospace",
                      whiteSpace: "nowrap", marginLeft: 12,
                    }}>{movie.year} · {movie.genre}</span>
                  </div>

                  <p style={{
                    fontSize: "14px", color: "#C4956A", margin: "8px 0 14px",
                    fontStyle: "italic",
                  }}>"{movie.tagline}"</p>

                  {/* Why */}
                  <div style={{
                    background: "rgba(139, 126, 200, 0.06)",
                    border: "1px solid rgba(139, 126, 200, 0.1)",
                    borderRadius: 6, padding: "12px 16px",
                    marginBottom: 12,
                  }}>
                    <p style={{
                      fontSize: "11px", color: "#8B7EC8", margin: "0 0 4px",
                      fontFamily: "'Courier New', monospace",
                      textTransform: "uppercase", letterSpacing: "1px",
                    }}>Why this film</p>
                    <p style={{
                      fontSize: "13px", color: "#C4B89A", margin: 0,
                      lineHeight: 1.6,
                    }}>{movie.why}</p>
                  </div>

                  {/* Axis match */}
                  <p style={{
                    fontSize: "11px", color: "#8A7E6E", margin: 0,
                    fontFamily: "'Courier New', monospace",
                  }}>
                    ✦ {getAxisExplanation(movie, answers)}
                  </p>

                  {/* Mini axis bars */}
                  <div style={{
                    display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap",
                  }}>
                    {["hedonic", "arousal", "moralFlex", "literacy", "social"].map((axis) => {
                      const diff = Math.abs(movie[axis] - answers[axis]);
                      const matchColor = diff < 0.2 ? "#4A9" : diff < 0.4 ? "#D4A843" : "#D4654A";
                      return (
                        <div key={axis} style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: "10px", fontFamily: "'Courier New', monospace",
                          color: "#8A7E6E",
                        }}>
                          <span>{axis.slice(0, 3)}</span>
                          <div style={{
                            width: 40, height: 4, background: "rgba(255,255,255,0.06)",
                            borderRadius: 2, overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${(1 - diff) * 100}%`, height: "100%",
                              background: matchColor, borderRadius: 2,
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Restart */}
            <div style={{ textAlign: "center", marginTop: 40, paddingBottom: 40 }}>
              <button
                onClick={reset}
                style={{
                  background: "rgba(212, 168, 67, 0.1)",
                  border: "1px solid rgba(212, 168, 67, 0.3)",
                  color: "#D4A843",
                  padding: "12px 32px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: "1.5px",
                  borderRadius: 6,
                }}
              >
                RETAKE PROFILE
              </button>
              <p style={{
                fontSize: "11px", color: "#8A7E6E", marginTop: 16,
                fontFamily: "'Courier New', monospace", lineHeight: 1.6,
              }}>
                Model: 5-axis weighted Euclidean distance × mood affinity scoring<br />
                Research base: Big Five, ADT, Oliver & Raney (2011), Cognitive Film Theory
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        button:active { transform: scale(0.98); }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212, 168, 67, 0.2); border-radius: 3px; }
      `}</style>
    </div>
  );
}

import icon from "../assets/icons/gyrobit-icon.png";

export function SplashScreen() {
  return (
    <section className="splash-screen">
      <div className="splash-orbit" />
      <img className="splash-icon" src={icon} alt="Gyrobit" />
      <h1>Gyrobit</h1>
      <p>Motion control</p>
    </section>
  );
}

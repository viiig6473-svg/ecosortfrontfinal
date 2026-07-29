import { useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [darkMode, setDarkMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage("");
    setError("");
  }

  async function analyzeImage() {
    if (!selectedImage) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const base64Image = await fileToBase64(selectedImage);

      const response = await fetch(
        "https://ecosort-backend-msrl.onrender.com/api/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Prediction failed.");
      }

      if (!result.message) {
        console.log("Full backend response:", result);
        throw new Error("No waste management message was returned.");
      }

      setMessage(result.message);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <nav className="navbar">
        <div className="logo" onClick={() => setPage("home")}>
          <span className="logoIcon">♻</span>
          <span>EcoSort AI</span>
        </div>

        <div className="navLinks">
          <button
            className={page === "home" ? "navActive" : ""}
            onClick={() => setPage("home")}
          >
            Home
          </button>

          <button
            className={page === "analyze" ? "navActive" : ""}
            onClick={() => setPage("analyze")}
          >
            Analyze
          </button>

          <button
            className={page === "guide" ? "navActive" : ""}
            onClick={() => setPage("guide")}
          >
            Waste Guide
          </button>

          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </nav>

      {page === "home" && <HomePage setPage={setPage} />}

      {page === "analyze" && (
        <AnalyzePage
          selectedImage={selectedImage}
          previewUrl={previewUrl}
          message={message}
          loading={loading}
          error={error}
          handleImageChange={handleImageChange}
          analyzeImage={analyzeImage}
        />
      )}

      {page === "guide" && <GuidePage setPage={setPage} />}
    </div>
  );
}

function HomePage({ setPage }) {
  return (
    <main className="page homePage">
      <section className="hero">
        <div className="heroText">
          <div className="badge">Smart Waste Management</div>

          <h1>
            Sort waste smarter with <span>EcoSort AI</span>
          </h1>

          <p>
            Upload an image of a waste item and get instant AI-powered disposal
            guidance. EcoSort helps users decide whether an item should be
            recycled, composted, handled as e-waste, or placed in general waste.
          </p>

          <div className="heroButtons">
            <button className="primaryBtn" onClick={() => setPage("analyze")}>
              Analyze Waste
            </button>

            <button className="secondaryBtn" onClick={() => setPage("guide")}>
              Learn Sorting Rules
            </button>
          </div>
        </div>

        <div className="heroCard">
          <div className="floatingIcon">🌱</div>
          <h2>How it works</h2>

          <div className="steps">
            <div>
              <strong>1</strong>
              <p>Upload a clear image of a waste item.</p>
            </div>

            <div>
              <strong>2</strong>
              <p>AI predicts the material or waste category.</p>
            </div>

            <div>
              <strong>3</strong>
              <p>You receive practical disposal advice.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="featureCard">
          <h3>Fast classification</h3>
          <p>
            Get results in seconds using your deployed Roboflow workflow and
            Render backend.
          </p>
        </div>

        <div className="featureCard">
          <h3>Cleaner recycling</h3>
          <p>
            Learn when to rinse, flatten, separate, compost, or dispose of items
            safely.
          </p>
        </div>

        <div className="featureCard">
          <h3>Beginner friendly</h3>
          <p>
            No complicated waste codes. The site gives simple guidance in plain
            language.
          </p>
        </div>
      </section>
    </main>
  );
}

function AnalyzePage({
  selectedImage,
  previewUrl,
  message,
  loading,
  error,
  handleImageChange,
  analyzeImage,
}) {
  return (
    <main className="page analyzePage">
      <section className="analyzeGrid">
        <div className="infoPanel">
          <div className="badge">AI Detection</div>

          <h1>Analyze your waste item</h1>

          <p>
            Upload a photo of one waste item or a clear pile of similar waste.
            For best results, use good lighting and keep the object centered.
          </p>

          <ul className="tips">
            <li>Use a clear image.</li>
            <li>Avoid blurry or dark photos.</li>
            <li>Place the item in the center.</li>
            <li>Try another angle if the result looks wrong.</li>
          </ul>
        </div>

        <div className="uploadCard">
          <label className="uploadBox">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <span>{selectedImage ? selectedImage.name : "Choose an image"}</span>
          </label>

          {previewUrl ? (
            <img src={previewUrl} alt="Uploaded waste" className="preview" />
          ) : (
            <div className="emptyPreview">
              <span>🖼️</span>
              <p>Your image preview will appear here</p>
            </div>
          )}

          <button
            className="primaryBtn fullWidth"
            onClick={analyzeImage}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Waste"}
          </button>

          {error && <div className="error">{error}</div>}

          {message && (
            <div className="result">
              <h2>Analysis Result</h2>
              <p>{message}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function GuidePage({ setPage }) {
  return (
    <main className="page guidePage">
      <section className="guideHeader">
        <div className="badge">Waste Guide</div>

        <h1>Simple waste management practices</h1>

        <p>
          These are general sorting tips. Local recycling rules can vary, so
          always follow your city or campus guidelines when available.
        </p>
      </section>

      <section className="guideGrid">
        <GuideCard
          icon="🥤"
          title="Plastic"
          text="Rinse bottles and containers, remove leftover liquids, flatten if possible, and recycle only if accepted locally."
        />

        <GuideCard
          icon="📦"
          title="Paper and cardboard"
          text="Keep paper dry and clean. Flatten cardboard boxes. Food-stained paper may need compost or general waste."
        />

        <GuideCard
          icon="🥫"
          title="Metal cans"
          text="Empty and rinse cans before recycling. Handle aerosol cans according to local rules."
        />

        <GuideCard
          icon="🍎"
          title="Organic waste"
          text="Fruit peels, food scraps, and plant waste can usually go into compost or an organic waste bin."
        />

        <GuideCard
          icon="🔋"
          title="Batteries and e-waste"
          text="Do not throw batteries or electronics in regular trash. Use an e-waste or hazardous waste collection point."
        />

        <GuideCard
          icon="🗑️"
          title="General waste"
          text="Use general waste for dirty, mixed, or non-recyclable items. Separate recyclable parts whenever possible."
        />
      </section>

      <div className="center">
        <button className="primaryBtn" onClick={() => setPage("analyze")}>
          Try the AI Analyzer
        </button>
      </div>
    </main>
  );
}

function GuideCard({ icon, title, text }) {
  return (
    <div className="guideCard">
      <div className="guideIcon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default App;

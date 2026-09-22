import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL =
  "https://ecosort-backend-msrl.onrender.com/api/predict";

const wasteTypes = [
  {
    icon: "♻️",
    title: "Plastic",
    className: "plastic",
    description:
      "Rinse containers, remove residue, and recycle them where accepted.",
  },
  {
    icon: "📦",
    title: "Cardboard",
    className: "cardboard",
    description:
      "Keep it clean and dry, remove tape when possible, and flatten it.",
  },
  {
    icon: "📄",
    title: "Paper",
    className: "paper",
    description:
      "Recycle clean paper. Compost or discard paper contaminated with food.",
  },
  {
    icon: "🥫",
    title: "Metal",
    className: "metal",
    description:
      "Empty and rinse cans before placing them in metal recycling.",
  },
  {
    icon: "🍾",
    title: "Glass",
    className: "glass",
    description:
      "Rinse bottles and jars. Handle broken glass according to local rules.",
  },
  {
    icon: "🗑️",
    title: "General Waste",
    className: "trash",
    description:
      "Use general waste for dirty, mixed, or non-recyclable materials.",
  },
];

function App() {
  const [page, setPage] = useState("home");
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("ecosort-theme") === "dark";
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ecosort-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function navigate(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateAndSelectImage(file) {
    setError("");
    setMessage("");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setError("The image must be smaller than 10 MB.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleImageChange(event) {
    validateAndSelectImage(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    validateAndSelectImage(event.dataTransfer.files?.[0]);
  }

  function clearImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setSelectedImage(null);
    setPreviewUrl("");
    setMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const value = String(reader.result);
        resolve(value.includes(",") ? value.split(",")[1] : value);
      };

      reader.onerror = () => reject(new Error("Could not read the image."));
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImage() {
    if (!selectedImage) {
      setError("Choose an image before starting the analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const base64Image = await fileToBase64(selectedImage);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "The analysis failed."
        );
      }

      if (!result.message) {
        console.error("EcoSort backend response:", result);
        throw new Error("No analysis message was returned.");
      }

      setMessage(result.message);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError.message ||
          "EcoSort could not analyze this image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Header
        page={page}
        navigate={navigate}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {page === "home" && <HomePage navigate={navigate} />}

      {page === "analyze" && (
        <AnalyzePage
          selectedImage={selectedImage}
          previewUrl={previewUrl}
          message={message}
          loading={loading}
          error={error}
          dragging={dragging}
          fileInputRef={fileInputRef}
          setDragging={setDragging}
          handleImageChange={handleImageChange}
          handleDrop={handleDrop}
          analyzeImage={analyzeImage}
          clearImage={clearImage}
        />
      )}

      {page === "guide" && <GuidePage navigate={navigate} />}

      <Footer navigate={navigate} />
    </div>
  );
}

function Header({ page, navigate, darkMode, setDarkMode }) {
  return (
    <header className="siteHeader">
      <nav className="navbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brandMark">♻</span>

          <span className="brandText">
            <strong>EcoSort</strong>
            <small>AI Waste Intelligence</small>
          </span>
        </button>

        <div className="navLinks">
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => navigate("home")}
          >
            Home
          </button>

          <button
            className={page === "analyze" ? "active" : ""}
            onClick={() => navigate("analyze")}
          >
            Analyzer
          </button>

          <button
            className={page === "guide" ? "active" : ""}
            onClick={() => navigate("guide")}
          >
            Waste Guide
          </button>
        </div>

        <button
          className="themeButton"
          onClick={() => setDarkMode((current) => !current)}
          aria-label="Toggle color theme"
          title="Toggle color theme"
        >
          <span>{darkMode ? "☀️" : "🌙"}</span>
          <span className="themeLabel">
            {darkMode ? "Light" : "Dark"}
          </span>
        </button>
      </nav>
    </header>
  );
}

function HomePage({ navigate }) {
  return (
    <main>
      <section className="hero sectionWidth">
        <div className="heroContent">
          <div className="eyebrow">
            <span className="statusDot" />
            AI-powered waste classification
          </div>

          <h1>
            A smarter way to understand
            <span> where waste belongs.</span>
          </h1>

          <p className="heroDescription">
            Photograph a waste item and let EcoSort identify its category,
            estimate confidence, and provide clear disposal guidance in
            seconds.
          </p>

          <div className="heroActions">
            <button
              className="primaryButton"
              onClick={() => navigate("analyze")}
            >
              <span>Start an analysis</span>
              <span>→</span>
            </button>

            <button
              className="secondaryButton"
              onClick={() => navigate("guide")}
            >
              Explore the waste guide
            </button>
          </div>

          <div className="trustRow">
            <div>
              <strong>6</strong>
              <span>waste categories</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>image classification</span>
            </div>

            <div>
              <strong>Fast</strong>
              <span>disposal guidance</span>
            </div>
          </div>
        </div>

        <div className="heroVisual">
          <div className="visualGlow" />

          <div className="scannerCard">
            <div className="scannerTop">
              <span>Live classification</span>
              <span className="onlineBadge">Ready</span>
            </div>

            <div className="sampleImage">
              <div className="leafShape leafOne" />
              <div className="leafShape leafTwo" />
              <div className="recycleOrb">♻</div>
              <div className="scanLine" />
            </div>

            <div className="sampleResult">
              <div>
                <span className="resultIcon">✓</span>
                <div>
                  <small>Example result</small>
                  <strong>Plastic container</strong>
                </div>
              </div>

              <span className="confidencePill">94%</span>
            </div>
          </div>

          <div className="floatingCard floatingCardOne">
            <span>🌱</span>
            <div>
              <strong>Clear advice</strong>
              <small>Practical next steps</small>
            </div>
          </div>

          <div className="floatingCard floatingCardTwo">
            <span>⚡</span>
            <div>
              <strong>Fast results</strong>
              <small>Powered by AI</small>
            </div>
          </div>
        </div>
      </section>

      <section className="processSection sectionWidth">
        <div className="sectionHeading">
          <div>
            <span className="sectionLabel">How it works</span>
            <h2>From image to action in three steps</h2>
          </div>

          <p>
            EcoSort turns computer-vision predictions into advice that is easy
            to understand and act on.
          </p>
        </div>

        <div className="processGrid">
          <ProcessCard
            number="01"
            icon="📷"
            title="Capture"
            description="Upload or photograph a clear image of the waste item."
          />

          <ProcessCard
            number="02"
            icon="✦"
            title="Classify"
            description="The AI evaluates the image and predicts its waste category."
          />

          <ProcessCard
            number="03"
            icon="🌿"
            title="Act"
            description="Receive simple preparation and disposal recommendations."
          />
        </div>
      </section>

      <section className="categorySection sectionWidth">
        <div className="sectionHeading">
          <div>
            <span className="sectionLabel">Supported categories</span>
            <h2>Built for common household waste</h2>
          </div>

          <button
            className="textButton"
            onClick={() => navigate("guide")}
          >
            View the complete guide →
          </button>
        </div>

        <div className="categoryGrid">
          {wasteTypes.map((item) => (
            <article className="categoryCard" key={item.title}>
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ctaSection sectionWidth">
        <div>
          <span className="sectionLabel lightLabel">Ready to sort smarter?</span>
          <h2>Give your waste a better destination.</h2>
          <p>
            Upload an image and receive an AI-powered recommendation in moments.
          </p>
        </div>

        <button className="lightButton" onClick={() => navigate("analyze")}>
          Open the analyzer →
        </button>
      </section>
    </main>
  );
}

function ProcessCard({ number, icon, title, description }) {
  return (
    <article className="processCard">
      <div className="processTop">
        <span className="processIcon">{icon}</span>
        <span className="processNumber">{number}</span>
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function AnalyzePage({
  selectedImage,
  previewUrl,
  message,
  loading,
  error,
  dragging,
  fileInputRef,
  setDragging,
  handleImageChange,
  handleDrop,
  analyzeImage,
  clearImage,
}) {
  const parsedResult = parseResultMessage(message);

  return (
    <main className="analyzerPage sectionWidth">
      <div className="pageHeading">
        <div className="eyebrow">
          <span className="statusDot" />
          EcoSort Vision
        </div>

        <h1>Analyze a waste item</h1>
        <p>
          Upload a clear image to identify the material and receive disposal
          guidance.
        </p>
      </div>

      <div className="analyzerLayout">
        <section className="analyzerCard">
          <div className="cardHeader">
            <div>
              <span className="stepBadge">Step 1</span>
              <h2>Upload an image</h2>
            </div>

            {selectedImage && (
              <button className="clearButton" onClick={clearImage}>
                Remove
              </button>
            )}
          </div>

          <div
            className={`dropZone ${dragging ? "dragging" : ""} ${
              previewUrl ? "hasImage" : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />

            {previewUrl ? (
              <img
                className="uploadedPreview"
                src={previewUrl}
                alt="Waste selected for analysis"
              />
            ) : (
              <div className="dropContent">
                <div className="uploadIcon">↑</div>
                <h3>Drop an image here</h3>
                <p>or select a JPG, PNG, or WEBP image up to 10 MB</p>

                <button
                  className="secondaryButton"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse images
                </button>
              </div>
            )}

            {previewUrl && (
              <button
                className="changeImageButton"
                onClick={() => fileInputRef.current?.click()}
              >
                Change image
              </button>
            )}
          </div>

          <div className="analysisTips">
            <span>For a stronger prediction:</span>
            <ul>
              <li>Use good lighting</li>
              <li>Keep the item centered</li>
              <li>Avoid heavy blur</li>
            </ul>
          </div>

          <button
            className="primaryButton analyzeButton"
            onClick={analyzeImage}
            disabled={loading || !selectedImage}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analyzing image...
              </>
            ) : (
              <>
                <span>✦</span>
                Analyze waste
              </>
            )}
          </button>

          {error && <div className="errorBox">{error}</div>}
        </section>

        <section className="resultPanel">
          <div className="cardHeader">
            <div>
              <span className="stepBadge">Step 2</span>
              <h2>Classification result</h2>
            </div>
          </div>

          {!message && !loading && (
            <div className="emptyResult">
              <div className="emptyResultIcon">◎</div>
              <h3>Your result will appear here</h3>
              <p>
                Choose an image and run the analysis to see its predicted
                category and disposal advice.
              </p>
            </div>
          )}

          {loading && (
            <div className="loadingResult">
              <div className="analysisAnimation">
                <span />
                <span />
                <span />
              </div>

              <h3>EcoSort is examining your image</h3>
              <p>Identifying material patterns and preparing guidance...</p>
            </div>
          )}

          {message && !loading && (
            <div className="completedResult">
              <div className="resultHero">
                <div className="largeResultIcon">
                  {getCategoryIcon(parsedResult.category)}
                </div>

                <div>
                  <span className="resultStatus">Analysis complete</span>
                  <h3>{parsedResult.category || "Waste item"}</h3>
                </div>

                {parsedResult.confidence && (
                  <span className="largeConfidence">
                    {parsedResult.confidence}
                  </span>
                )}
              </div>

              <div className="guidanceBox">
                <span className="guidanceIcon">🌿</span>
                <div>
                  <h4>Recommended practice</h4>
                  <p>{parsedResult.guidance || message}</p>
                </div>
              </div>

              <button className="secondaryButton fullButton" onClick={clearImage}>
                Analyze another image
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function GuidePage({ navigate }) {
  return (
    <main className="guidePage sectionWidth">
      <div className="pageHeading guideHeading">
        <div className="eyebrow">
          <span className="statusDot" />
          Sorting knowledge
        </div>

        <h1>The EcoSort waste guide</h1>

        <p>
          Use these general preparation tips alongside the recycling rules in
          your local area.
        </p>
      </div>

      <section className="guideGrid">
        {wasteTypes.map((item) => (
          <article className="guideCard" key={item.title}>
            <div className={`guideIcon ${item.className}`}>{item.icon}</div>

            <div>
              <span className="guideCategory">Waste category</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>

            <div className="guideChecklist">
              <span>✓ Separate mixed materials when possible</span>
              <span>✓ Remove food and liquid residue</span>
              <span>✓ Follow local collection requirements</span>
            </div>
          </article>
        ))}
      </section>

      <section className="guideNotice">
        <span>ⓘ</span>
        <div>
          <h3>Local rules take priority</h3>
          <p>
            Recycling availability and preparation requirements vary by
            location. Confirm uncertain items with your local waste authority.
          </p>
        </div>
      </section>

      <div className="guideAction">
        <button className="primaryButton" onClick={() => navigate("analyze")}>
          Analyze an item →
        </button>
      </div>
    </main>
  );
}

function Footer({ navigate }) {
  return (
    <footer className="footer">
      <div className="footerInner sectionWidth">
        <div className="footerBrand">
          <span className="brandMark">♻</span>
          <div>
            <strong>EcoSort AI</strong>
            <p>Smarter decisions for cleaner waste streams.</p>
          </div>
        </div>

        <div className="footerLinks">
          <button onClick={() => navigate("home")}>Home</button>
          <button onClick={() => navigate("analyze")}>Analyzer</button>
          <button onClick={() => navigate("guide")}>Waste Guide</button>
        </div>

        <p className="copyright">
          © {new Date().getFullYear()} EcoSort AI
        </p>
      </div>
    </footer>
  );
}

function parseResultMessage(message) {
  if (!message) {
    return {
      category: "",
      confidence: "",
      guidance: "",
    };
  }

  const detectedMatch = message.match(
    /Detected:\s*(.*?)(?:\s*\(([\d.]+%\s*confidence)\))?\.\s*Waste management practice:\s*(.*)/i
  );

  if (!detectedMatch) {
    return {
      category: "",
      confidence: "",
      guidance: message,
    };
  }

  return {
    category: detectedMatch[1]?.trim() || "",
    confidence: detectedMatch[2]
      ? detectedMatch[2].replace(/\s*confidence/i, "")
      : "",
    guidance: detectedMatch[3]?.trim() || "",
  };
}

function getCategoryIcon(category) {
  const name = String(category).toLowerCase();

  if (name.includes("plastic")) return "🥤";
  if (name.includes("cardboard")) return "📦";
  if (name.includes("paper")) return "📄";
  if (name.includes("metal")) return "🥫";
  if (name.includes("glass")) return "🍾";
  if (name.includes("trash")) return "🗑️";

  return "♻️";
}

export default App;

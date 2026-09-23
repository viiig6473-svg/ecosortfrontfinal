import { useEffect, useState } from "react";
import "./App.css";

const API =
  "https://ecosort-backend-msrl.onrender.com";

const CLASSES = [
  "cardboard",
  "glass",
  "metal",
  "paper",
  "plastic",
  "trash",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const value = String(reader.result);
      resolve(value.split(",")[1]);
    };

    reader.onerror = () =>
      reject(new Error("Could not read the image."));

    reader.readAsDataURL(file);
  });
}

function App() {
  const [page, setPage] = useState("home");
  const [dark, setDark] = useState(
    () => localStorage.getItem("ecosort-theme") === "dark"
  );

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [verdict, setVerdict] = useState("");
  const [correctClass, setCorrectClass] = useState("");
  const [consent, setConsent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "ecosort-theme",
      dark ? "dark" : "light"
    );
  }, [dark]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function navigate(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFeedback() {
    setVerdict("");
    setCorrectClass("");
    setConsent(false);
    setFeedbackSaved(false);
    setFeedbackError("");
  }

  function chooseFile(nextFile) {
    if (!nextFile) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(nextFile.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB.");
      return;
    }

    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setResult(null);
    setError("");
    resetFeedback();
  }

  function clearImage() {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
    resetFeedback();
  }

  async function analyze() {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    resetFeedback();

    try {
      const image = await fileToBase64(file);

      const response = await fetch(`${API}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.");
      }

      if (!data.message) {
        throw new Error("The analysis returned no message.");
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError.message || "Could not analyze the image."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitFeedback() {
    if (!file || !result?.feedbackToken) return;

    if (!verdict) {
      setFeedbackError("Select Right or Wrong.");
      return;
    }

    if (verdict === "wrong" && !correctClass) {
      setFeedbackError("Choose the correct category.");
      return;
    }

    if (!consent) {
      setFeedbackError(
        "Please agree before sending your image for review."
      );
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");

    try {
      const image = await fileToBase64(file);

      const response = await fetch(`${API}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          feedbackToken: result.feedbackToken,
          verdict,
          correctClass:
            verdict === "wrong" ? correctClass : undefined,
          consent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not save your feedback."
        );
      }

      setFeedbackSaved(true);
    } catch (requestError) {
      setFeedbackError(
        requestError.message || "Could not save feedback."
      );
    } finally {
      setFeedbackLoading(false);
    }
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="header">
        <button
          className="brand"
          onClick={() => navigate("home")}
        >
          ♻ <span>EcoSort</span>
        </button>

        <nav aria-label="Main navigation">
          <button onClick={() => navigate("home")}>
            Home
          </button>
          <button onClick={() => navigate("analyze")}>
            Check an item
          </button>
          <button onClick={() => navigate("guide")}>
            Waste guide
          </button>
        </nav>

        <button
          className="themeButton"
          onClick={() => setDark(!dark)}
        >
          {dark ? "☀ Light" : "☾ Dark"}
        </button>
      </header>

      {page === "home" && (
        <main className="container">
          <section className="hero">
            <div>
              <span className="eyebrow">
                Everyday recycling, made simpler
              </span>

              <h1>
                Not sure where it goes?
                <span> Let EcoSort help.</span>
              </h1>

              <p>
                Take a photo of an item and get practical
                advice on how to handle it responsibly.
              </p>

              <button
                className="primary"
                onClick={() => navigate("analyze")}
              >
                Check an item →
              </button>
            </div>

            <div className="heroArt" aria-hidden="true">
              <div className="heroCircle">♻</div>
              <p>Small choices add up.</p>
            </div>
          </section>

          <section className="steps">
            <h2>Three simple steps</h2>

            <div className="grid three">
              <article>
                <span>01</span>
                <h3>Take a photo</h3>
                <p>Use a clear image of the item.</p>
              </article>

              <article>
                <span>02</span>
                <h3>Check the result</h3>
                <p>See the suggested waste category.</p>
              </article>

              <article>
                <span>03</span>
                <h3>Get guidance</h3>
                <p>Learn how to dispose of it responsibly.</p>
              </article>
            </div>
          </section>
        </main>
      )}

      {page === "analyze" && (
        <main className="container checker">
          <div className="pageIntro">
            <span className="eyebrow">Item checker</span>
            <h1>Where should this go?</h1>
            <p>
              Upload one clear photo. You can tell us if the
              suggested category is right.
            </p>
          </div>

          <div className="grid two">
            <section className="panel">
              <h2>Your photo</h2>

              <label
                className="dropArea"
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={(event) => {
                  event.preventDefault();
                  chooseFile(
                    event.dataTransfer.files?.[0]
                  );
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) =>
                    chooseFile(event.target.files?.[0])
                  }
                />

                {preview ? (
                  <img
                    src={preview}
                    alt="Selected waste item"
                  />
                ) : (
                  <span>
                    📷
                    <strong>
                      Click or drop a photo here
                    </strong>
                    <small>
                      JPG, PNG, or WEBP · up to 10 MB
                    </small>
                  </span>
                )}
              </label>

              <div className="actions">
                {file && (
                  <button
                    className="secondary"
                    onClick={clearImage}
                  >
                    Remove
                  </button>
                )}

                <button
                  className="primary"
                  onClick={analyze}
                  disabled={!file || loading}
                >
                  {loading
                    ? "Checking..."
                    : "Check this item"}
                </button>
              </div>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </section>

            <section className="panel">
              <h2>What we found</h2>

              {!result && !loading && (
                <div className="placeholder">
                  <div>🌿</div>
                  <p>
                    Your result will appear here after
                    you check an item.
                  </p>
                </div>
              )}

              {loading && (
                <div
                  className="placeholder"
                  role="status"
                >
                  <div className="spinner" />
                  <p>Checking your item…</p>
                </div>
              )}

              {result && !loading && (
                <>
                  <div
                    className="result"
                    aria-live="polite"
                  >
                    {result.predictedClass && (
                      <span className="category">
                        {result.predictedClass}
                      </span>
                    )}

                    <p>{result.message}</p>
                  </div>

                  {result.feedbackToken && (
                    <div className="feedback">
                      <h3>Did we get this right?</h3>
                      <p>
                        Your answer helps us find
                        examples to review.
                      </p>

                      {feedbackSaved ? (
                        <p className="success">
                          Thank you! Your feedback was
                          saved for review.
                        </p>
                      ) : (
                        <>
                          <div className="choiceRow">
                            <button
                              className={
                                verdict === "correct"
                                  ? "selected"
                                  : ""
                              }
                              onClick={() => {
                                setVerdict("correct");
                                setCorrectClass("");
                              }}
                            >
                              ✓ Right
                            </button>

                            <button
                              className={
                                verdict === "wrong"
                                  ? "selected"
                                  : ""
                              }
                              onClick={() =>
                                setVerdict("wrong")
                              }
                            >
                              ✕ Wrong
                            </button>
                          </div>

                          {verdict === "wrong" && (
                            <label className="field">
                              What is it instead?

                              <select
                                value={correctClass}
                                onChange={(event) =>
                                  setCorrectClass(
                                    event.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select a category
                                </option>

                                {CLASSES.filter(
                                  (item) =>
                                    item !==
                                    result.predictedClass
                                ).map((item) => (
                                  <option
                                    value={item}
                                    key={item}
                                  >
                                    {item}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          {verdict && (
                            <>
                              <label className="consent">
                                <input
                                  type="checkbox"
                                  checked={consent}
                                  onChange={(event) =>
                                    setConsent(
                                      event.target.checked
                                    )
                                  }
                                />

                                <span>
                                  I agree to send this
                                  photo and my answer to
                                  EcoSort’s Roboflow
                                  dataset for review.
                                </span>
                              </label>

                              <button
                                className="primary"
                                disabled={
                                  feedbackLoading ||
                                  !consent
                                }
                                onClick={submitFeedback}
                              >
                                {feedbackLoading
                                  ? "Saving..."
                                  : "Send feedback"}
                              </button>
                            </>
                          )}

                          {feedbackError && (
                            <p
                              className="error"
                              role="alert"
                            >
                              {feedbackError}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      )}

      {page === "guide" && (
        <main className="container guide">
          <div className="pageIntro">
            <span className="eyebrow">
              Simple sorting tips
            </span>
            <h1>Waste guide</h1>
            <p>
              Local recycling rules vary. Use this
              guidance alongside your local collection
              instructions.
            </p>
          </div>

          <div className="grid three">
            {[
              ["📦", "Cardboard", "Flatten it and keep it dry."],
              ["🍾", "Glass", "Rinse it and check local glass rules."],
              ["🥫", "Metal", "Empty and rinse cans."],
              ["📄", "Paper", "Recycle clean, dry paper."],
              ["🥤", "Plastic", "Check your local accepted plastic types."],
              ["🗑", "Trash", "Separate recyclables where possible."],
            ].map(([icon, title, text]) => (
              <article className="guideCard" key={title}>
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </main>
      )}

      <footer>
        EcoSort · Practical guidance for everyday waste
      </footer>
    </div>
  );
}

export default App;

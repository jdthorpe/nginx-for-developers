import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [results, setResults] = useState(null);

    const getResults = async (method) => {
        var res;
        try {
            if (method === "get") {
                res = await axios.get("./api/echo", {
                    params: { message: message },
                });
            } else {
                res = await axios.post("./api/echo", {
                    message: message,
                });
            }
            setResults(res.data);
            setErrorMessage(null);
        } catch (err) {
            setErrorMessage(err.message);
            setResults(null);
        }
    };

    return (
        <div className="App">
            <h1>Enter a message here</h1>
            <textarea
                id="w3review"
                name="w3review"
                rows="4"
                cols="50"
                onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <p>
                Send the message to the backend in a <code>GET</code> or{" "}
                <code>POST</code> request at the <code>/api/echo</code> endpoint
            </p>
            <button onClick={() => getResults("get")}>Get</button>
            <button
                onClick={() => getResults("post")}
                style={{ marginLeft: "1rem" }}
            >
                Post
            </button>
            <p>View the reponse here:</p>
            {results ? (
                <pre
                    style={{
                        backgroundColor: "#e8e8e8",
                        textAlign: "left",
                        paddingRight: "1rem",
                        margin: "1rem 3rem",
                        overflow: "auto",
                    }}
                >
                    {results}
                </pre>
            ) : null}
            {errorMessage ? (
                <pre
                    style={{
                        backgroundColor: "#eb9dbb",
                        textAlign: "left",
                        margin: "1rem 3rem",
                        overflow: "hidden",
                    }}
                >
                    {errorMessage}
                </pre>
            ) : null}
        </div>
    );
}

export default App;

        var apiKey = "";
        var apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        var questions = [];
        
          
        if (!apiKey || apiKey === "") { 
              var params = new URLSearchParams(window.location.search);
              apiKey = params.get("key");
              if (!apiKey || apiKey === "") {
              apiKey = prompt("Please enter your API Key:");
              var url = new URL(window.location);
              url.searchParams.set("key", apiKey);
            }
        }
        

        // 🔹 Generate Quiz
        async function generateQuiz() {
            document.getElementById("quiz").innerHTML = "Loading...";
            document.getElementById("result").innerHTML = "";
            var quizType = document.getElementById("quizType").value;
            var questionsCount = document.getElementById("questionsCount").value;
            var customTopic = "";
            if (quizType === "Custom") {
                 customQuizTopic = document.getElementById("customTopic").value;
            }else{
                customQuizTopic = quizType;
            }
            var response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "user",
                            content: `
Generate ${questionsCount} ${customQuizTopic} questions in STRICT JSON format:
[
  {
    "question": "",
    "type": "single | multi | boolean ",
    "options": ["A","B","C","D"],
    "correct": ["A"]
  }
]
Return ONLY JSON.
`
                        }
                    ]
                })
            });

            var data = await response.json();
            var text = data.choices[0].message.content;

            try {
                questions = JSON.parse(text);
                displayQuiz();
                document.getElementById("btnSubmit").classList.remove("hide");
            } catch {
                document.getElementById("quiz").innerHTML = "❌ Error parsing AI response";
                document.getElementById("btnSubmit").classList.add("hide");
            }
            displayDiv("submitDiv");
        }
        // 🔹 Display Quiz
        function displayQuiz() {
            var quizDiv = document.getElementById("quiz");
            quizDiv.innerHTML = "";

            questions.forEach((q, index) => {
                var html = `<div class="question"><p><b>Q${index + 1}:</b> ${q.question}</p>`;

                if (q.type === "single") {
                    q.options.forEach(opt => {
                        html += `<label><input type="radio" name="q${index}" value="${opt}"> ${opt}</label><br>`;
                    });
                }

                else if (q.type === "multi") {
                    q.options.forEach(opt => {
                        html += `<label><input type="checkbox" name="q${index}" value="${opt}"> ${opt}</label><br>`;
                    });
                }

                else if (q.type === "boolean") {
                    ["Yes", "No"].forEach(opt => {
                        html += `<label><input type="radio" name="q${index}" value="${opt}"> ${opt}</label><br>`;
                    });
                }

                else if (q.type === "text") {
                    html += `<input type="text" name="q${index}" placeholder="Your answer">`;
                }

                html += `</div>`;
                quizDiv.innerHTML += html;
            });
        }

        // 🔹 Get User Answers
        function getUserAnswers() {
            var answers = [];

            questions.forEach((q, index) => {
                var selected = [];

                if (q.type === "single" || q.type === "boolean") {
                    var val = document.querySelector(`input[name="q${index}"]:checked`);
                    selected = val ? [val.value] : [];
                    q.type === "boolean" && (selected = selected.map(v => v === "Yes" ? "True" : "False"));
                }

                else if (q.type === "multi") {
                    var checked = document.querySelectorAll(`input[name="q${index}"]:checked`);
                    selected = Array.from(checked).map(cb => cb.value);
                }

                else if (q.type === "text") {
                    var input = document.querySelector(`input[name="q${index}"]`);
                    selected = input && input.value ? [input.value] : [];
                }

                answers.push({
                    question: q.question,
                    selected
                });
            });

            return answers;
        }

        // 🔹 Submit Quiz
        async function submitQuiz() {
            var userAnswers = getUserAnswers();
            var questionsCount = document.getElementById("questionsCount").value;

            var response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-20b",
                    messages: [
                        {
                            role: "user",
                            content: `
        Evaluate this quiz and return ONLY valid JSON:

        {
        "score": "x/y",
        "results": [
            {
            "question": "...",
            "userAnswer": "...",
            "correctAnswer": "...",
            "explanation": "...",
            "reference": "https://..."
            }
        ]
        }

        Questions:
        ${JSON.stringify(questions)}

        User Answers:
        ${JSON.stringify(userAnswers)}
        `
                        }
                    ]
                })
            });

            var data = await response.json();

            // Parse AI JSON output
            var resultText = data.choices[0].message.content;
            var parsed = JSON.parse(resultText);

            // Build table HTML
            let html = `<h3>Score: ${parsed.score}</h3>`;
            html += `<table border="1" style="border-collapse: collapse; width:100%">`;
            html += `
                <tr>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Correct Answer</th>
                    <th>Explanation</th>
                    <th>Reference</th>
                </tr>
            `;

            parsed.results.forEach(r => {
                html += `
                    <tr>
                        <td>${r.question}</td>
                        <td>${r.userAnswer}</td>
                        <td>${r.correctAnswer}</td>
                        <td>${r.explanation}</td>
                        <td><a href="${r.reference}" target="_blank">Link</a></td>
                    </tr>
                `;
            });

            html += `</table>`;

            document.getElementById("result").innerHTML = html;
            displayDiv("aiWarningBanner");

        }
            
        function displayDiv(divId) {
            let el = document.getElementById(divId);
            el.style.display = "block";
        }

        function hideDiv(divId) {
            let el = document.getElementById(divId);    
            el.style.display = "none"; 
        }

document.addEventListener("DOMContentLoaded", function () {
        hideDiv("submitDiv");
        hideDiv("aiWarningBanner");
        //drop down change event to hide results and submit button
        document.getElementById("quizType").addEventListener("change", function() {
            var selectedValue = this.value;
            if (selectedValue === "Custom") {
                let el = document.getElementById("customTopic");
                el.style.display = "inline";
            } else {
                hideDiv("customTopic");
            }
        });
});




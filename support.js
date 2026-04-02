        var apiKey = "";
        var apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        var questions = [];
        
        // 🔹 Generate Quiz
        async function generateQuiz() {
            document.getElementById("quiz").innerHTML = "Loading...";

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
Generate 5 AI-200 questions in STRICT JSON format:
[
  {
    "question": "",
    "type": "single | multi | boolean | text",
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
            } catch {
                document.getElementById("quiz").innerHTML = "❌ Error parsing AI response";
            }
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
Evaluate this quiz:

Questions:
${JSON.stringify(questions)}

User Answers:
${JSON.stringify(userAnswers)}

Return:
- Score out of 5
- Correct answers
- Short explanation
`
                        }
                    ]
                })
            });

            var data = await response.json();

            document.getElementById("result").innerText =
                data.choices[0].message.content;
        }


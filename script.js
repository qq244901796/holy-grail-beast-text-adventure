const output = document.getElementById("output");
const input = document.getElementById("choiceInput");
const submitButton = document.getElementById("submitBtn");
const restartButton = document.getElementById("restartBtn");

let session = TextAdventureEngine.createSession("local-demo");

function render(text) {
    output.textContent = text;
}

function refresh() {
    render(TextAdventureEngine.getView(session));
}

function submitChoice() {
    const value = input.value.trim();
    const result = TextAdventureEngine.choose(session, value);
    if (!result.ok) {
        render(`${TextAdventureEngine.getView(session)}\n\n提示：${result.message}`);
        return;
    }
    input.value = "";
    render(result.message);
}

submitButton.addEventListener("click", submitChoice);
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitChoice();
    }
});

restartButton.addEventListener("click", () => {
    session = TextAdventureEngine.createSession("local-demo");
    input.value = "";
    refresh();
});

refresh();

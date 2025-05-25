document.getElementById("login_field").addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    const submitBtn = document.querySelector("#sign_in");
    submitBtn.disabled = true;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok && result.token) {
            localStorage.setItem("token", result.token); // JWT 저장
            window.location.href = result.redirectUrl;
        }
    } catch (err) {
        // console.error("로그인 오류:", err);
        alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
        submitBtn.disabled = false;
    }
});
window.addEventListener("load", () => {
    const btn_soundSearch = document.getElementById("soundlist-searchbox-button")
    const inp_soundSearch = document.getElementById("soundlist-searchbox")

    btn_soundSearch.addEventListener("click", () => {
        if (inp_soundSearch.classList.contains("open")) {
            inp_soundSearch.classList.remove("open")
            inp_soundSearch.value = ""
            btn_soundSearch.innerHTML = "search"
        } else {
            inp_soundSearch.classList.add("open")
            inp_soundSearch.focus()
            btn_soundSearch.innerHTML = "close"
        }
    })

    document.addEventListener("click", (e) => {
        if (!e.path.includes(inp_soundSearch) && !e.path.includes(btn_soundSearch) && inp_soundSearch.value == "") {
            inp_soundSearch.classList.remove("open")
            inp_soundSearch.value = ""
            btn_soundSearch.innerHTML = "search"
        }
    })
})
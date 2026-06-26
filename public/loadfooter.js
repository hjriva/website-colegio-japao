const scriptUrl = new URL(document.currentScript.src);
const footerUrl = new URL("footer.html", scriptUrl);

fetch(footerUrl)
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("footer-placeholder").innerHTML = html;
  });
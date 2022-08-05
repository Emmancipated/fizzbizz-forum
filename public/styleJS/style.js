const menuKey = document.querySelector(".hamburger-container");
const stick = document.querySelectorAll(".stick");
const dropdownList = document.querySelector(".dropdown-content");
const focusTest = document.querySelector(".focus-test");
const searchboxDiv = document.querySelector(".searchbox");
const setYear = new Date;
const year = setYear.getFullYear();
const footer = document.querySelector('.footer').innerHTML = year;
const searchBar = document.querySelector(".focus-test");
const searchBarForm = document.querySelector(".searchbar-form");
const alink = document.querySelector(".poster-link");
var catHead = document.querySelector(".cat-header").innerHTML;
alink.href = `compose/post/${catHead}`

searchBar.addEventListener("keypress", (e)=>{
  if(e.key === "Enter") {
    searchBarForm.submit();
  } 
});

let counter = 0;
function animeMenu() {
    counter++;
    stick.forEach( stick => {
      if(counter % 2 == !0) {
        stick.classList.remove("close");
        stick.classList.add("open");
        dropdownList.classList.add("show");
        dropdownList.classList.remove("content-closer");
        dropdownList.classList.add("content-opener");
      } else {
      stick.classList.remove("open");
      stick.classList.add("close");
      dropdownList.classList.remove("show");
      dropdownList.classList.remove("content-opener");
      dropdownList.classList.add("content-closer");
      }
    });
};

function displaySearch(e) {
  let slicer = Number(getComputedStyle(focusTest).width.slice(0, -2));
  if (e.target = searchboxDiv && slicer <= 100) {
    focusTest.focus();
  } else {
    focusTest.blur();
  } 
};


menuKey.addEventListener("click", animeMenu);
searchboxDiv.addEventListener("click", displaySearch);
// focusTest.addEventListener("click", hideInput);


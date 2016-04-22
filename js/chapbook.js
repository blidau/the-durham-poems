/**
 *
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2015  Benjamin Laird
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

"use strict";

function ChapbookPrinter(chapbook, publisher, city, country, images, quotes, acknowledgements) {
   this.chapbook = chapbook;
   this.acknowledgements = acknowledgements;
   this.acknowledgementsRendered = null;
   this.publisher = publisher;
   this.images = images;
   this.quotes = quotes;
   this.city = city; 
   this.country = country; 
   this.year = new Date().getUTCFullYear(); 

   this.currentPageSpread = 0;
   this.modeDoublePage = true;
   this.inTransition = false;

   this.removePage = "#page-1";
   this.turningPage = "#page-2";

   this.pageSettings = [
      {
         "side" : "recto",
         "header" : { "x" : 60, "y" : 40, "edge" : "start"},
         "footer" : { "x" : 360, "y" : 460, "edge" : "end"},
         "width" : 400,
         "height" : 500,
         "edge" : "end"
      },
      {
         "side" : "verso",
         "header" : { "x" : 40, "y" : 40, "edge" : "start"},
         "footer" : { "x" : 40, "y" : 460, "edge" : "start"},
         "width" : 400,
         "height" : 500,
         "edge" : "start"
      }
   ];
   this.startingPage = 3;
   this.updatePublishingCity();

   /* add initial links */
   d3.select("#poems").insert("a").attr("id", "next-page");
   d3.select("#poems").insert("a").attr("id", "previous-page");

   /* render initial pages */
   this.addPage("page-1", true);
   this.addPage("page-2");

   this.tabulaRasa("#page-1", 0);
   this.tabulaRasa("#page-1", 1);

   this.printPreTitlePage("#page-2");
   this.printImagePage("#page-2", 0);
}

ChapbookPrinter.prototype.determinePublishingCity = function(geoposition) {
   var geocoder = new google.maps.Geocoder(),
      latlng = new google.maps.LatLng(geoposition.coords.latitude, geoposition.coords.longitude),
      _this = this,
      _city = this.city,
      _country = this.country,
      cityFound = false;
   geocoder.geocode({'latLng': latlng}, function(results, status) {
      var i,
         resultsAddressComponentsLength;
      if (status == google.maps.GeocoderStatus.OK) {
         if (results[0]) {
            for (i=0, resultsAddressComponentsLength=results[0].address_components.length;i<resultsAddressComponentsLength;i++) {
               if ((results[0].address_components[i].types[0]=="locality") && !cityFound ) {
                  _city = results[0].address_components[i].long_name;
                  cityFound = true;
               } else if ((results[0].address_components[i].types[0]=="administrative_area_level_2") && !cityFound ){
                  _city = results[0].address_components[i].long_name;
                  cityFound = true;
               }
               if (results[0].address_components[i].types[0]=="country") {
                  _country = results[0].address_components[i].long_name;
               }
            }
            if (!cityFound) {
               //reset
               _city = _this.city;
               _country = _this.country;
            }
         } 
      } 
      _this.city = _city;
      _this.country = _country;
   });
}

ChapbookPrinter.prototype.updatePublishingCity = function() { //update publishing city
   var _this = this;
   if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(geoposition) { 
         _this.determinePublishingCity(geoposition); 
      });
   } 
}
ChapbookPrinter.prototype.resetInTransition = function() {
   if (this.inTransition) {
      d3.select(this.removePage).remove();
      d3.select(this.turningPage).classed("turning", false); 
      this.inTransition = false;
   }
}
ChapbookPrinter.prototype.nextPage = function() {
   var removePageNum,
      turnPageNum,
      addPageNum,
      firstPage,
      afterPoems,
      newPageID,
      precedingPageID,
      followingPageID,
      pageShift;

   if (!this.inTransition) {
      if (this.modeDoublePage) {
         this.currentPageSpread += 1;
         if (this.currentPageSpread > (Math.floor(this.chapbook.poems.length/2) + 5)) {
            this.currentPageSpread = 0;
         }

         removePageNum = this.currentPageSpread > 0 ? this.currentPageSpread : Math.floor(this.chapbook.poems.length/2) + 6;
         turnPageNum = this.currentPageSpread + 1;
         addPageNum = (this.currentPageSpread < (Math.floor(this.chapbook.poems.length/2) + 5)) ? this.currentPageSpread + 2 : 1;
         firstPage = (this.currentPageSpread*2) - 6;
         afterPoems = Math.floor(this.chapbook.poems.length/2) + 4;

         this.removePage = "#page-" + removePageNum;
         this.turningPage = "#page-" + turnPageNum;
         this.addPage("page-" + addPageNum);

         d3.select("#page-" + turnPageNum).classed("turned", true).classed("turning", true);

         switch (true) {
            case this.currentPageSpread == 0:
               this.printPreTitlePage("#page-2");
               this.printImagePage("#page-2", 0);
               break;
            case this.currentPageSpread == 1:
               this.printTitlePage("#page-3");
               this.tabulaRasa("#page-3", 1);
               this.printImprintPage("#page-3");
               break;
            case this.currentPageSpread == 2:
               this.printContentsPage("#page-4");
               this.tabulaRasa("#page-4", 1);
               this.printQuotePage("#page-4");
               break;
            case this.currentPageSpread == 3:
               this.printPoemPage("#page-5", 0);
               break;
            case this.currentPageSpread == afterPoems:
               this.tabulaRasa("#page-" + turnPageNum, 1);
               this.printImagePage("#page-" + turnPageNum, 1);
               if (this.acknowledgements) {
                  this.printAcknowledgementsPage("#page-" + addPageNum);
               }
               break;
            case this.currentPageSpread == afterPoems + 1:
               //add blank to last page and to page 1
               this.tabulaRasa("#page-" + turnPageNum, 1);
               this.tabulaRasa("#page-" + addPageNum, 0);
               break;
            default:
               this.printPoemPage("#page-" + addPageNum, firstPage);
               this.printPoemPage("#page-" + turnPageNum, firstPage - 1);
               break;
         }
      } else {
         removePageNum = this.currentPageSpread + 1;
         this.currentPageSpread += 1;
         this.currentPageSpread = (this.currentPageSpread > this.chapbook.poems.length + 10) ? 0 : this.currentPageSpread;
         
         newPageID = this.currentPageSpread + 1;
         afterPoems = this.chapbook.poems.length + 6;
         precedingPageID = (this.currentPageSpread < 2) ? afterPoems + (4 + this.currentPageSpread): this.currentPageSpread - 1;
         followingPageID = (this.currentPageSpread + 1) > afterPoems + 4 ? 1 : newPageID + 1;

         this.addSinglePage("page-" + followingPageID, !(this.currentPageSpread % 2), false);
         this.removePage = "#page-" + precedingPageID; 

         pageShift = d3.select("#page-" + followingPageID);
         pageShift.classed("offscreen", true).classed("following", true);
         window.getComputedStyle(document.getElementById("poems")).height;
         pageShift.classed("offscreen", false);
         d3.select("#page-" + precedingPageID).classed("offscreen", true);
         d3.select("#page-" + removePageNum).classed("preceding", true);
         d3.select("#page-" + newPageID).classed("following", false);

         switch (true) {
            case this.currentPageSpread == 0: 
               this.printPreTitlePage("#page-1");
               break;
            case this.currentPageSpread == 1: 
               this.printImagePage("#page-2", 0);
               break;
            case this.currentPageSpread == 2: 
               this.printTitlePage("#page-3");
               break;
            case this.currentPageSpread == 3: 
               this.tabulaRasa("#page-4", 1);
               this.printImprintPage("#page-4");
               break;
            case this.currentPageSpread == 4:
               this.printContentsPage("#page-5"); 
               break;
            case this.currentPageSpread == 5:
               this.tabulaRasa("#page-6", 1);
               this.printQuotePage("#page-6");
               break;
            default:
               this.printPoemPage("#page-" + newPageID, this.currentPageSpread-6);
               break;
            case this.currentPageSpread == afterPoems:
               this.tabulaRasa("#page-" + newPageID, 0); //move function into page draw
               this.printImagePage("#page-" + newPageID, 1);
               break;
            case this.currentPageSpread == afterPoems + 1:
               this.tabulaRasa("#page-" + newPageID, 1);
               if (this.acknowledgements) {
                  this.printAcknowledgementsPage("#page-" + newPageID);
               }
               break;
            case this.currentPageSpread == afterPoems + 2:
               this.tabulaRasa("#page-" + newPageID, 0);
               break;
            case this.currentPageSpread == afterPoems + 3:
               this.tabulaRasa("#page-" + newPageID, 1);
               break;
            case this.currentPageSpread == afterPoems + 4:
               this.tabulaRasa("#page-" + newPageID, 0);
               break;
         }
      }
      this.inTransition = true;
   }
}

ChapbookPrinter.prototype.previousPage = function() {
   var afterPoems,
      addPageNum,
      unturnPageNum,
      removePageNum,
      firstPage,
      newPageID,
      precedingPageID,
      followingPageID,
      pageShift;

   if (!this.inTransition) {
      if (this.modeDoublePage) {
         this.currentPageSpread -= 1;
         if (this.currentPageSpread < 0) {
            this.currentPageSpread = Math.floor(this.chapbook.poems.length/2) + 5;
         }
         
         afterPoems = Math.floor(this.chapbook.poems.length/2) + 4;
         addPageNum = this.currentPageSpread + 1;
         unturnPageNum = this.currentPageSpread < afterPoems + 1 ? this.currentPageSpread + 2 : (this.currentPageSpread-afterPoems);
         removePageNum = this.currentPageSpread < afterPoems ? this.currentPageSpread + 3 : (this.currentPageSpread-afterPoems) + 1;
         firstPage = (this.currentPageSpread*2) - 6;

         this.removePage = "#page-" + removePageNum;
         this.turningPage = "#page-" + unturnPageNum;

         this.addPage("page-" + addPageNum, true, "#page-" + unturnPageNum);
         this.unturnPage("#page-" + unturnPageNum);

         switch (true) {
            case this.currentPageSpread == 0:
               this.tabulaRasa("#page-1", 0);
               this.tabulaRasa("#page-1", 1);
               break;
            case this.currentPageSpread == 1:
               this.printPreTitlePage("#page-2");
               this.printImagePage("#page-2", 0);
               break;
            case this.currentPageSpread == 2:
               this.printTitlePage("#page-3");
               this.tabulaRasa("#page-3", 1);
               this.printImprintPage("#page-3");
               break;
            case this.currentPageSpread == 3:
               this.printContentsPage("#page-4");
               this.tabulaRasa("#page-4", 1);
               this.printQuotePage("#page-4");
               this.printPoemPage("#page-5", 0);
               break;
            case this.currentPageSpread == afterPoems:
               this.tabulaRasa("#page-" + addPageNum, 1);
               this.printImagePage("#page-" + addPageNum, 1);
               if (this.acknowledgements) {
                  this.printAcknowledgementsPage("#page-" + unturnPageNum);
               }
               break;
            case this.currentPageSpread == afterPoems + 1:
               this.tabulaRasa("#page-" + addPageNum, 1);
               this.tabulaRasa("#page-" + unturnPageNum, 0);
               break;
            default:
               this.printPoemPage("#page-" + addPageNum, firstPage - 1);
               this.printPoemPage("#page-" + unturnPageNum, firstPage);
               break;
         }
      } else {
         removePageNum = this.currentPageSpread + 1;
         this.currentPageSpread -= 1;
         this.currentPageSpread = (this.currentPageSpread < 0) ? this.chapbook.poems.length + 10 : this.currentPageSpread;

         newPageID = this.currentPageSpread + 1;
         afterPoems = this.chapbook.poems.length + 6;
         precedingPageID = (this.currentPageSpread < 1) ? afterPoems + 5: this.currentPageSpread;
         followingPageID = (this.currentPageSpread + 2) > afterPoems + 4 ? 2 + (this.currentPageSpread - (this.chapbook.poems.length + 10)) : newPageID + 2;

         this.addSinglePage("page-" + precedingPageID, !(this.currentPageSpread % 2), false); 
         this.removePage = "#page-" + followingPageID; 
         
         pageShift = d3.select("#page-" + precedingPageID);
         pageShift.classed("offscreen", true).classed("preceding", true);
         window.getComputedStyle(document.getElementById("poems")).height;
         pageShift.classed("offscreen", false);
         
         d3.select("#page-" + followingPageID).classed("offscreen", true);

         d3.select("#page-" + removePageNum).classed("following", true);
         d3.select("#page-" + newPageID).classed("preceding", false);
         

         switch (true) {
            case this.currentPageSpread == 0: // pre title page
               this.printPreTitlePage("#page-1");//right
               break;
            case this.currentPageSpread == 1: // image
               this.printImagePage("#page-2", 0);
               break;
            case this.currentPageSpread == 2: // title page
               this.printTitlePage("#page-3");
               break;
            case this.currentPageSpread == 3: // imprint
               this.tabulaRasa("#page-4", 1);
               this.printImprintPage("#page-4");
               break;
            case this.currentPageSpread == 4:
               this.printContentsPage("#page-5");
               break;
            case this.currentPageSpread == 5:
               this.tabulaRasa("#page-6", 1);
               this.printQuotePage("#page-6");
               break;
            default:
               this.printPoemPage("#page-" + newPageID, this.currentPageSpread-6);
               break;
            case this.currentPageSpread == afterPoems:
               this.tabulaRasa("#page-" + newPageID, 0);
               this.printImagePage("#page-" + newPageID, 1);
               break;
            case this.currentPageSpread == afterPoems + 1:
               this.tabulaRasa("#page-" + newPageID, 1);
               if (this.acknowledgements) {
                  this.printAcknowledgementsPage("#page-" + newPageID);
               }
               break;
            case this.currentPageSpread == afterPoems + 2:
               this.tabulaRasa("#page-" + newPageID, 0);
               break;
            case this.currentPageSpread == afterPoems + 3:
               this.tabulaRasa("#page-" + newPageID, 1);
               break;
            case this.currentPageSpread == afterPoems + 4:
               this.tabulaRasa("#page-" + newPageID, 0);
               break;
         }
      }
      this.inTransition = true;
   }
}
ChapbookPrinter.prototype.addPage = function(pageID, turned, before) {
   var _this = this,
      insertLocation = before ? before : "#next-page",
      deltaX,
      touchX = 0,
      pageAdded = d3.select("#poems").insert("div", insertLocation).attr("id", pageID).attr("class", "page").classed("turned", turned).on("transitionend", function() { _this.resetInTransition() }),
      rectoPage = pageAdded.append("div").attr("class", "recto-page"),
      versoPage = pageAdded.append("div").attr("class", "verso-page");

   rectoPage.append("div").attr("class","recto pages");
   rectoPage.on("click", 
         function() { 
            if (d3.event.defaultPrevented) return;
            _this.nextPage(); }
      );
   rectoPage.on("touchmove", 
         function() { 
            d3.event.preventDefault();
            if (touchX == 0) {
               touchX = d3.event.changedTouches[0].pageX;
            }
         }
      );
   rectoPage.on("touchend", 
         function() { 
            if (d3.event.defaultPrevented) return;
            deltaX = touchX - d3.event.changedTouches[0].pageX;
            if ((deltaX > 0) || (touchX==0)) {
               _this.nextPage();
            }
            else if (deltaX < 0) {
               _this.previousPage();
            }
            touchX = 0;
         }
      );
   versoPage.append("div").attr("class","verso pages");
   versoPage.on("click", 
         function() { 
            if (d3.event.defaultPrevented) return;
            _this.previousPage(); }
      );
   versoPage.on("touchmove", 
         function() { 
            d3.event.preventDefault();
            if (touchX == 0) {
               touchX = d3.event.changedTouches[0].pageX;
            }
         }
      );
   versoPage.on("touchend", 
         function() { 
            if (d3.event.defaultPrevented) return;
            deltaX = touchX - d3.event.changedTouches[0].pageX;
            if (deltaX > 0) {
               _this.nextPage();
            }
            else if ((deltaX < 0) || (touchX==0)) {
               _this.previousPage();
            }
            touchX = 0;
         }
      );

}
ChapbookPrinter.prototype.addSinglePage = function(pageID, isVerso, hasClass) {
   //append to #poems
   var _this = this,
      deltaY,
      touchY = 0,
      pageAdded = d3.select("#poems").insert("div").attr("id", pageID).attr("class", "page").on("transitionend", function() { _this.resetInTransition() }),
      pageClass = isVerso ? "verso-page" : "recto-page",
      newPage = pageAdded.append("div").attr("class", pageClass);

   newPage.on("click", 
         function() { 
            if (d3.event.defaultPrevented) return;
            _this.nextPage(); }
      );
   newPage.on("touchmove", 
         function() { 
            d3.event.preventDefault();
            if (touchY == 0) {
               touchY = d3.event.changedTouches[0].pageY;
            }
         }
      );
   newPage.on("touchend", 
         function() { 
            if (d3.event.defaultPrevented) return;
            deltaY = touchY - d3.event.changedTouches[0].pageY;
            if ((deltaY > 0) || (touchY==0)) {
               _this.nextPage();
            }
            else if (deltaY < 0) {
               _this.previousPage();
            }
            touchY = 0;
         }
      );
}

ChapbookPrinter.prototype.unturnPage = function(pageID) {
   d3.select(pageID).classed("turned", false).classed("turning", true);
}

ChapbookPrinter.prototype.singlePageMode = function() {
   var versoPage,
      rectoPage,
      afterPoems,
      currentPageID,
      precedingPageID,
      followingPageID;

   if (this.modeDoublePage && !this.inTransition){
      this.modeDoublePage = false;
      d3.select("#single-page").attr("disabled", "disabled");
      d3.select("#double-page").attr("disabled", null);
      d3.select("body").classed("single-page-mode", true);

      versoPage = this.currentPageSpread + 1;
      rectoPage = (this.currentPageSpread < (Math.floor(this.chapbook.poems.length/2) + 5)) ? this.currentPageSpread + 2 : 1;
      afterPoems = this.chapbook.poems.length + 6; 
      
      d3.select("#page-" + versoPage).remove();
      d3.select("#page-" + rectoPage).remove();
      d3.select("#previous-page").remove();
      d3.select("#next-page").remove();

      this.currentPageSpread = this.currentPageSpread*2;

      currentPageID = this.currentPageSpread + 1;

      this.addSinglePage("page-" + currentPageID, this.currentPageSpread % 2, true); //add current page

      precedingPageID = (this.currentPageSpread == 0) ? afterPoems + 5: this.currentPageSpread;
      followingPageID = (this.currentPageSpread + 1) > afterPoems + 4 ? 1 : currentPageID + 1;

      this.addSinglePage("page-" + precedingPageID, true, true); 
      this.addSinglePage("page-" + followingPageID, true, true); 

      d3.select("#page-" + precedingPageID).classed("preceding", true);
      d3.select("#page-" + followingPageID).classed("following", true);

      switch (true) {
         case this.currentPageSpread == 0:
            this.printPreTitlePage("#page-1");
            break;
         case this.currentPageSpread == 1: 
            this.printImagePage("#page-2", 0);
            break;
         case this.currentPageSpread == 2: 
            this.printTitlePage("#page-3");
            break;
         case this.currentPageSpread == 3: 
            this.tabulaRasa("#page-4", 1);
            this.printImprintPage("#page-4");
            break;
         case this.currentPageSpread == 4:
            this.printContentsPage("#page-5"); 
            break;
         case this.currentPageSpread == 5:
            this.tabulaRasa("#page-6", 1);
            this.printQuotePage("#page-6");
            break;
         default:
            this.printPoemPage("#page-" + currentPageID, this.currentPageSpread-6);
            break;
         case this.currentPageSpread == afterPoems:
            this.tabulaRasa("#page-" + currentPageID, 0); 
            this.printImagePage("#page-" + currentPageID, 1);
            break;
         case this.currentPageSpread == afterPoems + 1:
            this.tabulaRasa("#page-" + currentPageID, 1);
            if (this.acknowledgements) {
               this.printAcknowledgementsPage("#page-" + currentPageID);
            }
            break;
         case this.currentPageSpread == afterPoems + 2:
            this.tabulaRasa("#page-" + currentPageID, 0);
            break;
         case this.currentPageSpread == afterPoems + 3:
            this.tabulaRasa("#page-" + currentPageID, 1);
            break;
         case this.currentPageSpread == afterPoems + 4:
            this.tabulaRasa("#page-" + currentPageID, 0);
            break;
      }
   }
}
ChapbookPrinter.prototype.doublePageMode = function() {
   var _this = this,
      currentPageID,
      afterPoems,
      precedingPageID,
      followingPageID,
      firstPageNum,
      secondPageNum,
      firstPage;

   if (!this.modeDoublePage && !this.inTransition) {
      this.modeDoublePage = true;
      d3.select("#double-page").attr("disabled", "disabled");
      d3.select("#single-page").attr("disabled", null);
      d3.select("body").classed("single-page-mode", false);
      
      d3.select("#poems").insert("a").attr("id", "next-page").on("click", 
         function() { _this.nextPage(); }
      );
      d3.select("#poems").insert("a").attr("id", "previous-page").on("click", 
         function() { _this.previousPage(); }
      );
      currentPageID = this.currentPageSpread + 1;
      afterPoems = this.chapbook.poems.length + 6;

      d3.select("#page-" + currentPageID).remove();
      
      precedingPageID = (this.currentPageSpread == 0) ? afterPoems + 5: this.currentPageSpread;
      followingPageID = (this.currentPageSpread + 1) > afterPoems + 4 ? 1 : currentPageID + 1;

      d3.select("#page-" + precedingPageID).remove();
      d3.select("#page-" + followingPageID).remove();

      this.currentPageSpread = Math.ceil(this.currentPageSpread/2);
      
      if (this.currentPageSpread > (Math.floor(this.chapbook.poems.length/2) + 5)) {
               this.currentPageSpread = 0;
      }

      firstPageNum = this.currentPageSpread + 1;
      secondPageNum = (this.currentPageSpread < (Math.floor(this.chapbook.poems.length/2) + 5)) ? this.currentPageSpread + 2 : 1;
      firstPage = (this.currentPageSpread*2) - 6;

      afterPoems = Math.floor(this.chapbook.poems.length/2) + 4;

      this.addPage("page-" + firstPageNum, true);
      this.addPage("page-" + secondPageNum);

      switch (true) {
         case this.currentPageSpread == 0:
            this.tabulaRasa("#page-1", 1);
            this.tabulaRasa("#page-1", 0);
            this.printPreTitlePage("#page-2");
            this.printImagePage("#page-2", 0);
            break;
         case this.currentPageSpread == 1:
            this.printPreTitlePage("#page-2");
            this.printImagePage("#page-2", 0);
            this.printTitlePage("#page-3");
            this.tabulaRasa("#page-3", 1);
            this.printImprintPage("#page-3");
            break;
         case this.currentPageSpread == 2:
            this.printTitlePage("#page-3");
            this.tabulaRasa("#page-3", 1);
            this.printImprintPage("#page-3");
            this.printContentsPage("#page-4");
            this.tabulaRasa("#page-4", 1);
            this.printQuotePage("#page-4");
            break;
         case this.currentPageSpread == 3:
            this.printContentsPage("#page-4");
            this.tabulaRasa("#page-4", 1);
            this.printQuotePage("#page-4");
            this.printPoemPage("#page-5", 0);
            break;
         case this.currentPageSpread == afterPoems:
            this.tabulaRasa("#page-" + firstPageNum, 1);
            this.printImagePage("#page-" + firstPageNum, 1);
            if (this.acknowledgements) {
               this.tabulaRasa("#page-" + secondPageNum, 0);
               this.printAcknowledgementsPage("#page-" + secondPageNum);
            }
            break;
         case this.currentPageSpread == afterPoems + 1:
            this.tabulaRasa("#page-" + firstPageNum, 1);
            this.tabulaRasa("#page-" + secondPageNum, 0);
            this.tabulaRasa("#page-" + secondPageNum, 1);
            break;
         default:
            this.printPoemPage("#page-" + firstPageNum, firstPage - 1);
            this.printPoemPage("#page-" + secondPageNum, firstPage);
            break;
      }
   }
}
ChapbookPrinter.prototype.printImprintPage = function(pageID) {
   var page = this.pageSettings[1],
      svg,
      xLayoutPosition = 40,
      yLayoutPosition = 50,
      yIncrement = 15;

   this.tabulaRasa(pageID, 1);

   svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition)
      .attr("text-anchor", "start")
      .text("First published " + this.year); 

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("by " + this.publisher.name);

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text(this.publisher.url);

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=(2*yIncrement))
      .attr("text-anchor", "start")
      .text("© " + this.chapbook.author.join(" ") + " " + this.year);

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=(2*yIncrement))
      .attr("text-anchor", "start")
      .text("Designed by Benjamin Laird");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("Typeset with D3");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("in Goudy Bookletter 1911");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=(2*yIncrement))
      .attr("text-anchor", "start")
      .text("Printed and bound in HTML, SVG, CSS and JavaScript");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("Distributed by the Internet");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=(2*yIncrement))
      .attr("text-anchor", "start")
      .text(this.chapbook.author.reverse().join(", "));

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text(this.chapbook.title + " / " + this.chapbook.author.reverse().join(" "));
   
   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("URI " + window.location.origin + window.location.pathname);

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=(2*yIncrement))
      .attr("text-anchor", "start")
      .text("This work is licensed");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("under the Creative Commons");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("Attribution-ShareAlike 4.0");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("International License");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("To view a copy of this license, visit");

   svg.append("text")
      .attr("class", "imprint")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=yIncrement)
      .attr("text-anchor", "start")
      .text("https://creativecommons.org/licenses/by-sa/4.0/");

}
ChapbookPrinter.prototype.printTitlePage = function(pageID) {
   var page = this.pageSettings[0],
      svg,
      xLayoutPosition = 200,
      yLayoutPosition = 40;
   
   this.tabulaRasa(pageID, 0);

   svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

   svg.append("text")
      .attr("class", "inter-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition)
      .attr("text-anchor", "middle")
      .text(this.chapbook.title.split(" ")[0].toUpperCase());

   svg.append("text")
      .attr("id", "main-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=50)
      .attr("text-anchor", "middle")
      .text(this.chapbook.title.split(" ").slice(1).join(" ").toUpperCase() + ";");
   
   svg.append("text")
      .attr("class", "inter-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=40)
      .attr("text-anchor", "middle")
      .text("OR,");

   svg.append("text")
      .attr("id", "main-alternate-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=40)
      .attr("text-anchor", "middle")
      .text(this.chapbook.alternateTitle.split(" ")[0].toUpperCase());

   svg.append("text")
      .attr("id", "sub-alternate-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=40)
      .attr("text-anchor", "middle")
      .text(this.chapbook.alternateTitle.split(" ").slice(1).join(" ").toUpperCase() + '.');

   svg.append("text")
      .attr("class", "inter-title")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=70)
      .attr("text-anchor", "middle")
      .text("BY");

   svg.append("text")
      .attr("id", "author")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=20)
      .attr("text-anchor", "middle")
      .text(this.chapbook.author.join(" ").toUpperCase());

   svg.append("text")
      .attr("class", "quote")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=60)
      .attr("text-anchor", "middle")
      .text("“" + this.quotes[0].quote + "”");

   svg.append("text")
      .attr("class", "quote-author")
      .attr("dx", xLayoutPosition + 110)
      .attr("dy", yLayoutPosition+=15)
      .attr("text-anchor", "end")
      .text(this.quotes[0].author + ".");

   svg.append("text")
      .attr("id", "place")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=45)
      .attr("text-anchor", "middle")
      .text(this.city.toUpperCase() + ", " + this.country.toUpperCase() + ":");

   svg.append("text")
      .attr("id", "publisher")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=20)
      .attr("text-anchor", "middle")
      .text(this.publisher.name.toUpperCase() + ".");

   svg.append("text")
      .attr("id", "year")
      .attr("dx", xLayoutPosition)
      .attr("dy", yLayoutPosition+=15)
      .attr("text-anchor", "middle")
      .text(this.year + ".");
}
ChapbookPrinter.prototype.printPreTitlePage = function(pageID) {
   var page = this.pageSettings[0],
      svg;

   this.tabulaRasa(pageID, 0);

   svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

   svg.append("text")
      .attr("id", "main-pre-title")
      .attr("dx", 200)
      .attr("dy", 180)
      .attr("text-anchor", "middle")
      .text((this.chapbook.title).toUpperCase());
   
}
ChapbookPrinter.prototype.printQuotePage = function(pageID) {
   var page = this.pageSettings[1],
      svg,
      text,
      words = ("“" + this.quotes[1].quote + "”").split(/\s+/).reverse(),
      word,
      width = 280,
      line = [],
      lineNumber = 0,
      lineHeight = 15,
      dy = 200,
      tspan;

   this.tabulaRasa(pageID, 1);
   
   svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

   text = svg.append("text")
      .attr("class", "quote")
      .attr("dx", 0)
      .attr("dy", 200)
      .attr("text-anchor", "start");
   tspan = text.append("tspan").attr("x", 50).attr("y", 0).attr("dy", dy);
   
   while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
         line.pop();
         tspan.text(line.join(" "));
         line = [word];
         tspan = text.append("tspan").attr("x", 60).attr("y", 0).attr("dy", ++lineNumber * lineHeight + dy).text(word);
      }
   }

   svg.append("text")
      .attr("class", "quote")
      .attr("dx", 110)
      .attr("dy", ++lineNumber * lineHeight + dy)
      .attr("text-anchor", "start")
      .text(this.quotes[1].author + ", " + this.quotes[1].place + ", " + this.quotes[1].date);
   
}
ChapbookPrinter.prototype.printImagePage = function(pageID, imageIndex) {
   var page = this.pageSettings[1];
   
   this.tabulaRasa(pageID, 1);

   d3.select(pageID + ">." + page.side + "-page")
      .append("img")
      .attr("src", this.images[imageIndex].src)
      .attr("alt", this.images[imageIndex].alt)
      .attr("id", "featured-image");
}
ChapbookPrinter.prototype.printContentsPage = function(pageID) {
   var page = this.pageSettings[0],
      svg,
      yLoc = 90,
      xLocTitle = 70,
      xLocPage = 320,
      increment = 20,
      i,
      chapbookLength;

   this.tabulaRasa(pageID, 0);
   
   svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

   svg.append("text")
      .attr("id", "contents-title")
      .attr("dx", (((xLocPage-xLocTitle)/2) + xLocTitle))
      .attr("dy", 50)
      .attr("text-anchor", "middle")
      .text("Contents".toUpperCase());

   for (i=0, chapbookLength = this.chapbook.poems.length;i<chapbookLength;i++) {
      svg.append("text")
         .attr("class", "contents-poem-title")
         .attr("dx", xLocTitle)
         .attr("dy", yLoc+(increment*i))
         .attr("text-anchor", "start")
         .text(this.chapbook.poems[i].title);

      svg.append("text")
         .attr("class", "contents-poem-page-number")
         .attr("dx", xLocPage)
         .attr("dy", yLoc+(increment*i))
         .attr("text-anchor", "end")
         .text(i+this.startingPage);
   }
}
ChapbookPrinter.prototype.printAcknowledgementsPage = function(pageID) {
   var page = this.pageSettings[0],
      svg,
      yLoc = 70,
      xLocTitle = 70,
      xLocPage = 320,
      increment = 20,
      text,
      words,
      word,
      width = 280,
      line = [],
      lineLength,
      wordSpacing,
      lineNumber = -1,
      lineHeight = 14,
      y = 12,
      dy,
      tspan,
      open = false,
      j;

   this.tabulaRasa(pageID, 0);
   if (!this.acknowledgementsRendered) {
      svg = d3.select(pageID+">." + page.side + "-page")
         .append("svg")
         .attr("class", page.side + "-page-svg")
         .attr("viewBox", "0 0 400 500");

      svg.append("text")
         .attr("class", "acknowledments-title")
         .attr("dx", (((xLocPage-xLocTitle)/2) + xLocTitle))
         .attr("dy", 50)
         .attr("text-anchor", "middle")
         .text("Acknowledgements".toUpperCase());

      for(var i=0;i<this.acknowledgements.text.length;i++) {
         text = svg.append("text")
            .attr("class", "acknowledgements")
            .attr("dx", 0)
            .attr("dy", yLoc)
            .attr("text-anchor", "start");

         tspan = text.append("tspan").attr("x", (((xLocPage-xLocTitle)/2) + xLocTitle)-140).attr("y", y).attr("dy", ++lineNumber * lineHeight + yLoc);
         if (i>0) {
            tspan.attr("dx",10);
            width = 270;
         } 
         words = this.acknowledgements.text[i].split(/\s+/).reverse();
         while (word = words.pop()) {
            line.push(word);
            tspan.html(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
               line.pop();
               if (open) {
                  line[0] = '<tspan style="font-style:italic">' + line[0];
               }
               for (j=0, lineLength=line.length;j<lineLength;j++) {
                  if (line[j].search(/\*/) > -1) {
                     if (open) {
                        line[j] = line[j].replace(/\*/, "</tspan>");
                        open = false;
                     } else {
                        line[j] = line[j].replace(/\*/, '<tspan style="font-style:italic">');
                        open = true;
                        if (line[j].search(/\*/) > -1) {
                           line[j] = line[j].replace(/\*/, "</tspan>");
                           open = false;
                        }
                     }
                  }
               }
               if (open) {
                  line[line.length-1] = line[line.length-1] + '</tspan>';
               }
               tspan.html(line.join(" "));
               wordSpacing = ((width - tspan.node().getComputedTextLength()) / (line.length-1)).toFixed(5);
               tspan.attr("word-spacing", wordSpacing);
               line = [word];
               width = 280;
               tspan = text.append("tspan").attr("x", (((xLocPage-xLocTitle)/2) + xLocTitle)-140).attr("y", y).attr("dy", ++lineNumber * lineHeight + yLoc).text(word);
            }
         }
         if (open) {
            line[0] = '<tspan style="font-style:italic">' + line[0];
         }
         for (j=0, lineLength=line.length;j<lineLength;j++) {
            if (line[j].search(/\*/) > -1) {
               if (open) {
                  line[j] = line[j].replace(/\*/, "</tspan>");
                  open = false;
               } else {
                  line[j] = line[j].replace(/\*/, '<tspan style="font-style:italic">');
                  open = true;
                  if (line[j].search(/\*/) > -1) {
                     line[j] = line[j].replace(/\*/, "</tspan>");
                     open = false;
                  }
               }
            }
         }
         if (open) {
            line[line.length-1] = line[line.length-1] + '</tspan>';
            open = false;
         }
         tspan.html(line.join(" "));
         line=[];
      }
      this.acknowledgementsRendered = svg.node();
   } else {
      d3.select(pageID+">." + page.side + "-page")
         .node()
         .appendChild(this.acknowledgementsRendered);
   }
}
ChapbookPrinter.prototype.printPoemPage = function(pageID, poemIndex) {
   var pageNumber = poemIndex + this.startingPage,
      page = this.pageSettings[(poemIndex % 2)],
      poem = this.chapbook.poems[poemIndex],
      svg,
      force,
      drag,
      link,
      node,
      nodeG;

   this.tabulaRasa(pageID, poemIndex);

   svg = d3.select(pageID+">." + page.side + "-page")
      .append("svg")
      .attr("class", page.side + "-page-svg")
      .attr("viewBox", "0 0 400 500");

   force = d3.layout.force()
      .gravity(0.05)
      .distance(100)
      .charge(-50)
      .size([page.width, page.height])
      .nodes(poem.nodes)
      .links(poem.links);
   drag = force.drag();
   link = svg.selectAll(".link-" + poemIndex + "-" + page.side)
      .data(poem.links, function(d){return d.id;});
   
   link.enter().insert("text")
      .attr("class", "text")
      .attr("text-anchor", "middle")
      .append("textPath")
      .attr("startOffset", "50%")
      .attr("xlink:href", function(d) {return "#l-" + poemIndex + "-" + page.side + "-" + d.id;})
      .text(function(d) { return d.text });

   link.enter().insert("path", ":first-child")
      .classed("link-" + page.side, true)
      .classed("link-" + poemIndex + "-" + page.side, true)
      .attr("id", function(d) {return "l-" + poemIndex + "-" + page.side + "-" +d.id;});

   link.exit().remove();

   node = svg.selectAll(".node-" + poemIndex + "-" + page.side)
      .data(poem.nodes, function(d){return d.id;});
   nodeG = node.enter().insert("g")
      .classed("node-" + page.side, true)
      .classed("node-" + poemIndex + "-" + page.side, true)
      .attr("id", function(d){return "n-" + poemIndex + "-" + page.side + "-" + d.id;})
      .call(drag);

   drag.on("drag", function() {
         d3.event.sourceEvent.stopPropagation(); 
   }).on("dragend", function() {
         d3.event.sourceEvent.stopPropagation(); 
   });
   
   nodeG.append("text")
      .attr("dx", 0)
      .attr("dy", 0)
      .attr("text-anchor", "middle")
      .text(function(d) { return d.text });

   node.exit().remove();
   force.on("tick", function() {
      link.attr("d", function(d) { return "M " + d.source.x + " " + d.source.y + "L "  + d.target.x + " " + d.target.y; } );
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
   });
   force.start();

   svg.append("text")
      .attr("class", "folio")
      .attr("dx", page.footer.x)
      .attr("dy", page.footer.y)
      .attr("text-anchor", page.footer.edge)
      .text(pageNumber);

   svg.append("text")
      .attr("class", "header")
      .attr("dx", page.header.x)
      .attr("dy", page.header.y)
      .attr("text-anchor", page.header.edge)
      .text(poem.title);
}
ChapbookPrinter.prototype.tabulaRasa = function(pageID, pageIndex) {
   var page = this.pageSettings[(pageIndex % 2)];
   d3.select(pageID).select("." + page.side + "-page").classed("no-page",false);
   d3.select(pageID).select("." + page.side + "-page-svg").remove();
   d3.select(pageID).select("." + page.side + "-page").select("#featured-image").remove();
}
ChapbookPrinter.prototype.removePage = function(pageID, pageIndex) {
   var page = this.pageSettings[(pageIndex % 2)];
   d3.select(pageID).select("." + page.side + "-page").classed("no-page",true);
}
function Chapbook(title, alternateTitle, author, poemsCollected) {
   this.poems = [];
   this.title = title;
   this.alternateTitle = alternateTitle;
   this.author = author;
   this.poemsCollected = poemsCollected;
}
Chapbook.prototype.addPoem = function(poem) {
   this.poems.push(poem);
}
Chapbook.prototype.prepareForPublication = function() {
   var manuscript = this.poems.slice(),
      index = manuscript.length,
      value, 
      randomIndex;

   while(0 != index) {
      randomIndex = Math.floor(Math.random() * index);
      index -= 1;
      value = manuscript[index];
      manuscript[index] = manuscript[randomIndex];
      manuscript[randomIndex] = value;
   }

   this.poems = manuscript.slice(0,this.poemsCollected);
}

function Poem(title, words, lines) {
   var i,
      wordsLength,
      linesLength,
      join;

   this.title = title;
   this.words = words;
   this.lines = lines;
   this.nodes = [];
   for (i=0, wordsLength=words.length; i<wordsLength; i++) {
      this.nodes.push({"id" : i, "text" : words[i]})
   }
   this.links = [];
   this.joins = [];
   for (i=0, linesLength=lines.length; i<linesLength; i++) {
      join = this.lineJoin();
      this.joins.push(join[0] + "," + join[1], join[1] + "," + join[0]);
      this.links.push({"id" : i, "source": join[0], "target": join[1], "text" : lines[i]});
   }
}
Poem.prototype.lineJoin = function() {
   var length = this.words.length,
      source = 0,
      target = 0;

   while ((source == target) || (this.joins.indexOf(source + "," + target) != -1)) {
      source = Math.floor(Math.random()*length);
      target = Math.floor(Math.random()*length);
   }
   return [source, target];
}

function ChapbookReader(chapbookPrinter, paratext) {
   var _this = this;

   this.chapbookPrinter = chapbookPrinter;
   this.paratext = paratext;
   this.isPlaying = false;
   this.pageTurnInterval = null;
   this.withControls = true;

   window.addEventListener('resize', function () {
      _this.updateWindow();
   });
   window.addEventListener('orientationchange', function () {
      _this.updateWindow();
   });
   if (!this.isFullscreenEnabled()) {
      d3.select("#fullscreen").remove();
   }
   d3.select("body").on("wheel", 
      function() { _this.pageScroll(); }
      );
   d3.select("#next-page").on("click", 
      function() { _this.chapbookPrinter.nextPage(); }
      );
   d3.select("#previous-page").on("click", 
      function() { _this.chapbookPrinter.previousPage(); }
      );
   d3.select(window).on("keydown", 
      function() { _this.pageKey(); }
      );
   d3.select("#controls-switch").on("click", 
      function() { _this.toggleControls(); }
      );

   d3.select("#play-pause").on("click", 
      function() { _this.playPauseReading(); }
      ).attr("disabled", null);

   d3.select("#about").on("click", 
      function() { _this.aboutChapbook(); }
      ).attr("disabled", null);
   d3.select("#share").on("click", 
      function() { _this.shareChapbook(); }
      ).attr("disabled", null);

   d3.select("#single-page").on("click", 
      function() { 
         _this.chapbookPrinter.singlePageMode(); 
         _this.updateWindow();
      }
      ).attr("disabled", null);
   d3.select("#double-page").on("click", 
      function() { 
         _this.chapbookPrinter.doublePageMode(); 
         _this.updateWindow();
      }
      ).attr("disabled", "disabled");

   d3.select("#fullscreen").on("click", 
      function() { _this.toggleFullScreen(); }
      ).attr("disabled", null);
   d3.select("#next-control").on("click", 
      function() { _this.chapbookPrinter.nextPage(); }
      ).attr("disabled", null);
   d3.select("#previous-control").on("click", 
      function() { _this.chapbookPrinter.previousPage(); }
      ).attr("disabled", null);

   /* disable double page if IE */
   if (this.isIE()) {
      this.chapbookPrinter.singlePageMode(); 
      d3.select("#single-page").attr("disabled", "disabled");
      d3.select("#double-page").attr("disabled", "disabled");
   }
   this.updateWindow();
}

ChapbookReader.prototype.updateWindow = function(){
   var x = this.chapbookPrinter.modeDoublePage ? window.innerWidth : window.innerWidth - 6,
      y = this.withControls ? window.innerHeight - 80 : window.innerHeight - 6,
      xOffset = this.chapbookPrinter.modeDoublePage ? 0 : 3,
      yOffset = this.withControls ? 40 : 3,
      xRatio = this.chapbookPrinter.modeDoublePage ? x/1266 : x/602,
      yRatio = y/752,
      ratio = xRatio <= yRatio ? xRatio : yRatio,
      xLoc = ((x - (ratio*1266))/2 + xOffset).toFixed(10) + "px", // toFixed add because of an issue with Safari and very small numbers using e notation/format
      yLoc = ((y - (ratio*752))/2 + yOffset).toFixed(10) + "px";

   d3.select("#poems").attr("style", "transform: translate("+ xLoc +","+ yLoc +") scale("+ ratio +");transform-origin: 0 0 0;-webkit-transform: translate("+ xLoc +","+ yLoc +") scale("+ ratio +");-webkit-transform-origin: 0 0 0;");

   if (!this.inFullscreen()) {
      d3.select("#fullscreen-icon").attr("src", "./images/fullscreen.svg").attr("alt","Go fullscreen").attr("title", "Go fullscreen");
   } else {
      
      d3.select("#fullscreen-icon").attr("src", "./images/exit-fullscreen.svg").attr("alt","Exit fullscreen").attr("title", "Exit fullscreen");
   }
}
ChapbookReader.prototype.inIFrame = function() {
   var _inIFrame;
   try {
      _inIFrame = window.self !== window.top;
   } catch (error) {
      _inIFrame = true;
   }
   return _inIFrame;
}
//https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
ChapbookReader.prototype.inFullscreen = function() {
   return document.fullscreenElement ||    // alternative standard method
      document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}
ChapbookReader.prototype.isFullscreenEnabled = function() {
   var _isFullscreenEnabled;

   if(document.fullscreenEnabled){
      _isFullscreenEnabled = document.fullscreenEnabled;
   }
   else if(document.msFullscreenEnabled){ 
      _isFullscreenEnabled = document.msFullscreenEnabled;
   } 
   else if (document.mozFullScreenEnabled){
      _isFullscreenEnabled = document.mozFullScreenEnabled;
   }
   else if (document.webkitFullscreenEnabled){
      _isFullscreenEnabled = document.webkitFullscreenEnabled;
   }
   return _isFullscreenEnabled;
}
ChapbookReader.prototype.toggleFullScreen = function() {
   if (!this.inFullscreen()) {  // current working methods
      if (document.documentElement.requestFullscreen) {
         document.documentElement.requestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
         document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
         document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
         document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
   } else {
      if (document.exitFullscreen) {
         document.exitFullscreen();
      } else if (document.msExitFullscreen) {
         document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
         document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
         document.webkitExitFullscreen();
      }
   }
}
ChapbookReader.prototype.toggleControls = function() {
   if (this.withControls) {
      d3.select("body").classed("with-controls", false).classed("without-controls", true);
      this.withControls = false;
      d3.select("#controls-switch").select("img").attr("src","./images/up-arrow.svg").attr("alt", "Show controls").attr("title", "Show controls");
      this.updateWindow();
   } else {
      d3.select("body").classed("with-controls", true).classed("without-controls", false);
      this.withControls = true;
      d3.select("#controls-switch").select("img").attr("src","./images/down-arrow.svg").attr("alt", "Hide controls").attr("title", "Hide controls");
      this.updateWindow();
   }
}
ChapbookReader.prototype.pageScroll = function() {
   if (!this.inIFrame() || this.inFullscreen()) {
      if (d3.event.deltaY > 0) {
         this.chapbookPrinter.nextPage();
      }
      else if (d3.event.deltaY < 0) {
         this.chapbookPrinter.previousPage();
      }
   }
}
ChapbookReader.prototype.pageKey = function() {
   var key = d3.event.key ? d3.event.key : d3.event.code;
   if (!this.inIFrame() || this.inFullscreen()) {
      switch (key) {
         case "ArrowRight":
         case "ArrowDown":
         case "Right":
         case "Down":
            this.chapbookPrinter.nextPage();
         break;
         case "ArrowLeft":
         case "ArrowUp":
         case "Left":
         case "Up":
            this.chapbookPrinter.previousPage();
         break;
      }
   } else {
      switch (key) {
         case "ArrowRight":
         case "Right":
            this.chapbookPrinter.nextPage();
         break;
         case "ArrowLeft":
         case "Left":
            this.chapbookPrinter.previousPage();
         break;
      }
   }
}
/* Internet Explorer versions 11 and below don't support preserve-3d, this is a compromise (and Microsoft Edge isn't available on Windows before version 10) */
ChapbookReader.prototype.isIE = function() {
   var userAgent = window.navigator.userAgent;
   if ((userAgent.indexOf('MSIE ')>0) || (userAgent.indexOf('Trident/')>0)) {
      return true;
   }
   return false;
}
ChapbookReader.prototype.playPauseReading = function() {
   var _this = this;
   if (!_this.isPlaying) {
      _this.isPlaying = true;
      d3.select("body").classed("reading", true);
      d3.select("#play-pause").select("img").attr("src","./images/pause.svg").attr("alt","Pause").attr("title","Pause");
      d3.select("#single-page").attr("disabled", "disabled");
      d3.select("#double-page").attr("disabled", "disabled");
      _this.chapbookPrinter.nextPage();
      _this.pageTurnInterval = window.setInterval(
         function() { _this.chapbookPrinter.nextPage(); }
         , 5000);
   } else {
      d3.select("body").classed("reading", false);
      d3.select("#play-pause").select("img").attr("src","./images/play.svg").attr("alt","Play").attr("title","Play");
      _this.isPlaying = false;
      window.clearInterval(this.pageTurnInterval);
      if (!_this.isIE()) {
         if (_this.chapbookPrinter.modeDoublePage) {
            d3.select("#single-page").attr("disabled", null);
         } else {
            d3.select("#double-page").attr("disabled", null);
         }
      }
   }
}
ChapbookReader.prototype.shareChapbook = function() {
   var sharePanel = this.addModal("Share"),
      readerURL = window.location.origin + window.location.pathname;
   sharePanel.append("h3").text("Link to this chapbook");
   sharePanel.append("input").attr("id", "chapbook-link").on("click", (function () { this.select(); })).attr("type","text").attr("readonly","readonly").attr("value", readerURL);
   sharePanel.append("h3").text("Embed this chapbook");
   sharePanel.append("textarea").attr("id", "chapbook-embed").on("click", (function () { this.select(); })).attr("readonly","readonly").attr("cols","60").attr("rows","5").html('&lt;iframe src="' + readerURL + '" style="width:100%;height:400px;" allowfullscreen="allowfullscreen"&gt;&lt;/iframe&gt;');
}
ChapbookReader.prototype.aboutChapbook = function() {
   var aboutPanel = this.addModal("About");
   aboutPanel.append("h3").html("About <cite>" + this.chapbookPrinter.chapbook.title + "</cite>");
   aboutPanel.append("p").html(this.paratext);
}
ChapbookReader.prototype.addModal = function(title) {
   var _this = this,
      modal = d3.select("body").insert("div", "#poems").attr("id", "modal"),
      modalTitle = title,
      modalName = title.toLowerCase(),
      modalPanel;

   modal.append("div").attr("id", "modal-screen");
   modalPanel = modal.append("div").attr("id", "modal-panel");
   modalPanel.append("button").attr("type", "button").attr("id","close-modal").on("click", 
         function () { _this.removeModal(); }
      ).append("img").attr("src", "./images/close.svg").attr("alt", "Close " + modalName).attr("title", "Close " + modalName);
   modalPanel.append("h2").text(modalTitle);
   d3.select("body").classed("show-modal", true);

   return modalPanel;
}

ChapbookReader.prototype.removeModal = function() {
   d3.select("body").classed("show-modal", false);
   d3.select("#modal").remove(); 
}
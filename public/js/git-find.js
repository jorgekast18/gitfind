var user;

// Function to hide first landing and show second landing
var clickEnter = function(){
	var containerSigIn = document.getElementById('containerSigIn'),
		containerRepos = document.getElementById('containerRepos'),
		navBar 		   = document.getElementById('navBar'),
		userName;

	if (containerSigIn.style.display === 'block') {
		// Hide container with first landing
		containerSigIn.style.display = 'none';
		// Show container with second landing
		containerRepos.style.display = 'block';

		// Show nav bar in second landing
		navBar.style.display = 'block';

		// Remove background color and image of firt landing
		$('body').css('background-color', 'transparent');
		$('body').css('background-image', 'none');
	}

	userName = document.getElementById('userName').value;
	showNameInNavBar(userName);
	loadDataFavorites(userName);
};

// Function to show name in nav bar
var showNameInNavBar = function(userName){
	// Format userName
	userName = userName.toUpperCase();
	// Set user name in nav bar
	document.getElementById('userNameInNavBar').innerHTML = userName;
};

// Function to sen requestion to API github to search repos
var searchRepo = function(){
	var inputSearchRepo,
		sort,
		order;

	inputSearchRepo = document.getElementById('searchRepo').value;
	sort  		    = 'starts';
	order 		    = 'desc';

	// Call loading mask 
	loadingMask('containerRepos', 'show', 'Cargando Repositorios...');
	// Call service to get repositories
	getRepos(inputSearchRepo, sort, order)
	.then(function(response){
		// Set data of response
		$.each(response.items, function(index, item){
			// Declare variables
			var cardRepo,
				card,
				cardTitle,
				cardBody,
				cardDescription,
				stars,
				rowButtons,
				divButtons,
				btnShowMore,
				btnFavoritelink;
			
			// Set variable
			cardRepo  		= $('<div></div>').addClass("col-sm-6");
			card      		= $('<div></div>').addClass("card containerInfoRepo").appendTo($(cardRepo));
			cardTitle 		= $('<div></div>').addClass("card-header titleRepo").html(item.name.toUpperCase()).appendTo($(card));
			cardBody  		= $('<div></div>').addClass("card-body").appendTo($(card));
			cardDescription = $('<div></div>').addClass("card-text").html(item.description).appendTo($(cardBody));
			cardDescription = $('<br>').appendTo($(cardBody));
			starts 			= $('<span></span>').addClass("card-text").html('Estrellas: ' + item.score).appendTo($(cardBody));
			
			// Create div to button show more and add to favorite
			rowButtons 		= $('<div></div>').addClass("row");
			rowButtons.appendTo($(cardBody));
			divButtons 		= $('<div></div>').addClass("col-sm-12");
			divButtons.appendTo($(rowButtons));

			// Create button show more
			btnShowMore = $('<button/>');
			btnShowMore.text('Ver mas..');
			btnShowMore.addClass('btn btn-enter float-left');
			btnShowMore.click(function(){
			   	window.open(item.html_url, '_blank');
			});
			btnShowMore.appendTo($(divButtons));

			// Create submit to add a favorite
			btnFavoritelink = $('<button/>');
			btnFavoritelink.addClass('btn float-right oi oi-star');
			btnFavoritelink.css('margin-top', '15%');
			btnFavoritelink.css('background-color', 'transparent');
			btnFavoritelink.attr('title', 'Agregar a favoritos');
			btnFavoritelink.click(function(){
			   	if(user.new){
			   		addFavorite(item);
			   	}else{
			   		updateFavorites(item);
			   	}
			});

			btnFavoritelink.appendTo($(divButtons));

			// Set div complete with info of repositories
			$('#repositoriesCards').append($(cardRepo));
		});

		// Remove loading mask
		loadingMask('containerRepos', 'hide');
	}, function(error){
		// Remove loading mask
		loadingMask('containerRepos', 'hide');
	});

};

// Service to get repositories
var getRepos = function(valueToSearch, sort, order){
	// Return a new promise
	return new Promise(function(resolve, reject){
		var request = new XMLHttpRequest();
			method  = 'GET',
			q 	    = valueToSearch,
			url     = 'https://api.github.com/search/repositories?q='+ q +'&sort='+ sort +'&order='+ order;			
		
		request.open(method, url);

		request.onload = function(){
			// Check status of response
			if(request.status === 200){
				// Parse response
				var response = JSON.parse(request.response);
				// Resolve the promise
				resolve(response);
			}else{
				// Reject promise when response succes is false
				reject(Erro(request.statusText));
			}
		};

		// Make the request
		request.send();
	});
};

// Loading mask
var loadingMask = function(element, action, text){
	$("#" + element).busyLoad(action, {
		text 	   : text,
		textColor  : "white",
		color 	   : "#fff",
		background : "rgba(0, 0, 0, 0.21)"
	});
};

// Function to load data in database firebase 
var loadDataFavorites = function(userName){
	var db 		 = firebase.firestore(),
		usersRef = db.collection('users');
	
	userName = userName.toUpperCase();
	
	// Call loading mask 
	loadingMask('containerRepos', 'show', 'Cargando favoritos...');
	usersRef.where('name', '==', userName).get()
	.then(function(doc){
		// Call loading mask 
		loadingMask('containerRepos', 'hide', '');
		if(doc.docs.length > 0){
			doc.docs.forEach(function(data){
				user 	   = data.data();
				user.new   = false;
				user.docId = data.id;
			})			
		}else{
			user = {
				name 	  : userName,
				favorites : {},
				new 	  : true
			};
			console.log('No hay datos')
		}
		// Call function to load favorites in wrap container favorites
		loadFavorites();
	}, function(error){
		// Call loading mask 
		loadingMask('containerRepos', 'hide', '');
		console.log('Error consultando datos. ' + error)
	});
};

// Function to load favorites wrap
var loadFavorites = function(){
	if(user.favorites.length){
		$('#favorites').remove();
		$('<div></div>').addClass("col-sm-12").attr('id', 'favorites').appendTo($('#repositoriesFavorites')); 
		user.favorites.forEach(function(data){
			// Declare variables
			var cardFavorite,
				card,
				cardTitle,
				cardBody,
				cardDescription;
			
			// Set variables
			cardFavorite    = $('<div></div>').addClass("col-sm-12"); 
			card      		= $('<div></div>').addClass("card containerInfoFavorite").appendTo($(cardFavorite));
			cardTitle 		= $('<div></div>').addClass("card-header").css('color', 'white').html('A ' + user.name.toUpperCase() + ' le gusta').appendTo($(card));
			cardBody  		= $('<div></div>').addClass("card-body").appendTo($(card));
			cardDescription = $('<div></div>').addClass("card-text titleYellow center").css('padding', '0px').html(data.name).appendTo($(cardBody));

			// Set div complete with info of repositories
			$('#favorites').append($(cardFavorite));
		});
	}
};

// Add repo to favorite container
var addFavorite = function(item){
	var db 		 = firebase.firestore(),
		usersRef = db.collection('users');
	
	// Call loading mask 
	loadingMask('containerRepos', 'show', 'Agregando a favoritos...');
	usersRef.add({
		name : user.name,
		favorites : [
			{
				name : item.name
			}
		]
	})
	.then(function(docRef){
		console.log('creado el documento -->' + docRef.id);
		// Call loading mask 
		loadingMask('containerRepos', 'hide', '');
		user.new = false;
		loadDataFavorites(user.name);
		
	})
	.catch(function(error){
		console.log('Error creando documento -->' + error);
		// Call loading mask 
		loadingMask('containerRepos', 'hide', '');
	});
};

// update document of favorite
var updateFavorites = function(item){
	var db 		 = firebase.firestore(),
		usersRef = db.collection('users').doc(user.docId);
	
	// Call loading mask 
	loadingMask('containerRepos', 'show', 'Actualizando favoritos...');
	return db.runTransaction(function(transaction) {
	    // This code may get re-run multiple times if there are conflicts.
	    return transaction.get(usersRef).then(function(data) {
	        if (data.exists) {
	        	var favorite = {
	        		name : item.name
	        	};
	        	var favorites = data.data().favorites;
	        	favorites.push(favorite);
	        	transaction.update(usersRef, { favorites: favorites });
	        }else{
	        	throw "El documento no existe";
	        }
	    });
	}).then(function() {
	    console.log("Documento actualizado");
	    loadDataFavorites(user.name);
	}).catch(function(error) {
		// Call loading mask 
		loadingMask('containerRepos', 'hide', '');
	    console.log("No se ha podido actualizar le documento -->", error);
	});
};



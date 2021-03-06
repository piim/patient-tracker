app.factory
(
	'popups',
	[
	 	function()
	 	{
	 		return {
	 			'signup': {controller:'UserCtrl'},
	 			'add-tracker': {controller:'AppCtrl'},
	 			'add-condition': {controller:'ConditionsCtrl'},
	 			'settings': {controller:'AppCtrl'},
	 			'record': {controller:'AppCtrl'},
	 			'remove-tracker-confirm': {controller:'AppCtrl'}
	 		};
	 	}
	 ]
);

app.factory
(
	"navigation",
	[
	 	'$location','$modal','model','popups','constants',
		 function($location,$modal,model,popups,constants)
		 {
			 return {
				 
				 path: null,
				 popup: null,
				 model: model,
				 
				 setLocation: function(path)
			 	 {
					 this.showPopup();
					 
					 this.path = path;
					 
			 		 $location.path(path);
			 	 },
			 	
			 	 showPopup: function( id, onClose, onDismiss )
			 	 {
			 		 if( this.popup )
			 		 {
			 			 try
			 			 {
			 				this.popup.dismiss();
			 			 }catch(e){}
			 		 }
			 			
			 		 
			 		 if( !id ) 
			 			 return;
			 		 
			 		 var def = popups[id];
			 		 var self = this;
			 		 
			 		 if( !def ) 
			 		 {
			 			 throw new Error('Definition for popup "' + id + '" couldn\'t be found');
			 			 
			 			 return;
			 		 }
			 		 
			 		 this.popup = $modal.open
			 		 (
			 			{
			 				templateUrl: 'popups/' + id + '.html',
		 			    	controller: def.controller
		 				}
		 			);
			 		
			 		var p = this.popup;
			 		
			 		this.popup.result.then
			 		(
			 			function () 
				 		{
			 				if( p == self.popup )
			 					self.popup = null;
				 		    
				 		    if( onClose )
				 		    	onClose();
				 		},
			 		    function () 
			 		    {
				 			if( p == self.popup )
			 					self.popup = null;
			 		    	
			 		    	if( onDismiss )
			 		    		onDismiss();
			 		    }
			 		);
			 		
			 		return this.popup;
		 		},
			 	
			 	viewTracker: function(type,tracker)
		 		{
			 		if( model.tracker == tracker )
			 		{
			 			model.tracker = null;
			 			return;
			 		}
			 		
			 		model.tracker = tracker;
		 		}
			};
		 }
	 ]
);
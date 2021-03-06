/**
 * Core application properties
 * TOOD: rename 'globals'?
 */
app.factory
(
	"model",
	[
	 	'constants',
		function(constants)
		{
			return { 
				
				//	whether or not there is a logged-in user
				loggedIn: false,
				
				patient: null,	//still used?
				
				repeatUnits: 
	 					[
	 				 		{value:"h",label:"hour"},
	 				 		{value:"d",label:"day"},
	 				 		{value:"wk",label:"week"},
	 				 		{value:"mo",label:"month"},
	 				 		{value:"a",label:"year"}
	 				 	],
	 				 		
				settings:		//unused
					[
					 	{label:"User Profile",target:"profile"},
					 	{label:"Settings"},
					 	{label:"Logout"}
					 ],
				
				timespans: 
					[
					 	{label:"1 week",value:1},
					 	{label:"1 month",value:4},
					 	{label:"6 months",value:24},
					 	{label:"1 year",value:52},
					 ],
				 
				//	all trackers
				trackers:null,
				//	trackers for the currently-selected condition
				trackersFiltered:null,
				
				//	selected condition (in /home view)
				selectedCondition:constants.CONDITION_ALL,
				
				selectedConditionId:undefined,
				
				//	selected tracker
				selectedTracker:null,
				selectedTrackerId:undefined,
				selectedTrackerType:null,
				
				//  selected tab
				tabs: {
					'compare': {active:false},
					'settings': {active:false},
					'trackers': {active:true}
				}
			};			
		}
	 ]
);

app.controller
(
	'AppCtrl',
	[
	 	'$scope','$rootScope','$routeParams','$location','$timeout','model','userModel','vitalsModel','vitalsService','medicationsModel','medicationsService','trackersModel','trackersService','conditionsService','conditionsModel','navigation','factory','utilities','constants',
	 	function($scope,$rootScope,$routeParams,$location,$timeout,model,userModel,vitalsModel,vitalsService,medicationsModel,medicationsService,trackersModel,trackersService,conditionsService,conditionsModel,navigation,factory,utilities,constants)
	 	{
	 		$scope.model = model;
	 		$scope.userModel = userModel;
	 		$scope.vitalsModel = vitalsModel;
	 		$scope.medicationsModel = medicationsModel;
	 		$scope.trackersModel = trackersModel;
	 		$scope.conditionsModel = conditionsModel;
	 		
	 		$scope.constants = constants;
	 		
	 		$scope.navigation = navigation;
	 		
	 		$scope.status = null;
	 		$scope.isCollapsed = true;
	 		
	 		/**
	 		 * Set `model.tracker` on routeParams
	 		 * NOTE: Not used
	 		 */
	 		if( $routeParams 
	 			&& $routeParams['tracker_type'] 
	 			&& $routeParams['tracker_id'] )
	 		{
	 			var id = $routeParams['tracker_id'];
	 			
	 			switch( $routeParams['tracker_type'] )
	 			{
	 				case constants.TYPE_VITAL:
	 					for(var t in vitalsModel.statements)
	 						if( vitalsModel.statements[t].id == id )
	 							$scope.model.tracker = vitalsModel.statements[t];
	 					break;
	 					
	 				case constants.TYPE_MEDICATION:
	 					for(var t in medicationsModel.statements)
	 						if( medicationsModel.statements[t].id == id )
	 							$scope.model.tracker = medicationsModel.statements[t];
	 					break;
	 					
	 				case constants.TYPE_TRACKER:
	 					for(var t in trackersModel.statements)
	 						if( trackersModel.statements[t].id == id )
	 							$scope.model.tracker = trackersModel.statements[t];
	 					break;
	 			}
	 		}
	 		
	 		//	user has successfully authenticated, either directly or indirectly via session
	 		$rootScope.$on
	 		(
	 			"authenticateSuccess",
	 			function()
	 			{
	 				$scope.model.patient = factory.patient($scope.userModel.userId);
	 				$scope.model.isLoggedIn = true;
 					
	 				//	init various sub-systems
	 				medicationsService.init();
	 				trackersService.init();
	 				vitalsService.init();
	 				conditionsService.init();
	 				
	 				$scope.setLocation('/home');
	 				
	 				//	hide popup if any and show home view
	 				if( userModel.user.isNew )
	 					$scope.showPopup('add-condition');
	 				else
	 					$scope.showPopup();
	 			}
	 		);
	 		
	 		/**
	 		 * LOGOUT 1 MK
	 		 */
	 		$rootScope.$on
	 		(
	 			"logoutSuccess",
	 			function()
	 			{
	 				$scope.model.patient = null;
	 				$scope.model.isLoggedIn = false;
	 				
	 				//	hide popup if any and show home view
	 				$scope.showPopup();
	 				$scope.setLocation('/');
	 			}
	 		);
	 		
	 		$rootScope.$on
	 		(
	 			"trackerDataAdded",
	 			function()
	 			{
	 				navigation.showPopup();
	 				
	 				model.selectedTrackerId = undefined;
	 				
	 				$timeout(function(){$scope.setStatus( "Your tracker has been added" );},1);
	 			}
	 		);
	 		
	 		/**
	 		 * Whenever statement collections in the various sub-system controllers change, update 
	 		 * a master `trackers` collection that contains all values (so we can list alphabetically, 
	 		 * regardless of section, etc)
	 		 */
	 		$scope.onTrackerUpdate = function(newVal,oldVal)
 			{
 				if( newVal!=oldVal )
 				{
 					var medicationStatements = medicationsModel.statements && medicationsModel.statements.length ? medicationsModel.statements : [];
 					var trackerStatements = trackersModel.statements && trackersModel.statements.length ? trackersModel.statements : [];
 					var vitalStatements = vitalsModel.statements && vitalsModel.statements.length ? vitalsModel.statements : [];
 					
 					$scope.model.trackers = medicationStatements.concat(trackerStatements).concat(vitalStatements);
 					
 					//	alphabetize
 					$scope.model.trackers.sort(utilities.sortByName);
 					
 					$scope.model.selectedConditionId = undefined;
 					
 					$scope.setStatus();
 				}
 			};
 			
 			$scope.$watchCollection('medicationsModel.statements',$scope.onTrackerUpdate);
	 		$scope.$watchCollection('trackersModel.statements',$scope.onTrackerUpdate);
	 		$scope.$watchCollection('vitalsModel.statements',$scope.onTrackerUpdate);
	 		
			$scope.$watchCollection
			(
				'conditionsModel.statements',
				function(newVal,oldVal)
				{
					if( newVal != oldVal && newVal && newVal.length )
					{
						$scope.safeApply();
					}
				}
			);
			
			$scope.$watch
			(
				'model.selectedCondition',
				function(newVal,oldVal)
				{
					if( newVal == oldVal ) return;
					
					window.localStorage.setItem("condition", model.selectedCondition ? model.selectedCondition.id : null);
				}
			);
			
	 		/**
	 		 * Initializes the `selectedTracker` property to the object associated with
	 		 * the current id; basically responds to <select> selection in popups/add-tracker
	 		 */
	 		$scope.$watch
			(
				'model.selectedTrackerId',
				function(newVal,oldVal)
				{
					if( newVal != oldVal )
					{
						$scope.setStatus();
						
						model.selectedTracker = null;
						
						for(var t in model.trackers)
						{
							if(model.trackers[t].code==newVal)
							{
								var now = new Date();
								
								var formData = 
								{
									date: now.getFullYear()+"-" + _.str.lpad(now.getMonth()+1,2,'0')+"-" + _.str.lpad(now.getDate(),2,'0'),
									time: _.str.lpad(now.getHours(),2,'0')+":"+_.str.lpad(now.getMinutes(),2,'0')
								};
								
								model.selectedTracker = model.trackers[t];
								
								if( vitalsModel.statements.indexOf(model.selectedTracker)>-1 )
								{
									model.selectedTrackerType = constants.TYPE_VITAL;
									
									formData.components = angular.copy(model.selectedTracker.definition.components);
									
									vitalsModel.form.add = formData;
								}
								else if( trackersModel.statements.indexOf(model.selectedTracker)>-1 )
								{
									model.selectedTrackerType = constants.TYPE_TRACKER;
									
									formData.components = angular.copy(model.selectedTracker.definition.components);
									
									trackersModel.form.add = formData;
								}
								else if( medicationsModel.statements.indexOf(model.selectedTracker)>-1 )
								{
									model.selectedTrackerType = constants.TYPE_MEDICATION;
									
									_.defaults(formData, {asNeeded: model.selectedTracker.asNeeded, dosageValue: model.selectedTracker.definition.components[0].value,dosageUnit: model.selectedTracker.definition.components[0].unit,routeCode:model.selectedTracker.definition.components[2].value, taken:true});
									
									medicationsModel.form.add = formData;
								}
							}
						}
					}
				}
			);
	 		
	 		$scope.$watch
			(
				'model.selectedConditionId',
				function(newVal,oldVal)
				{
					if( newVal != oldVal )
					{
						model.selectedCondition = constants.CONDITION_ALL;
						
						for(var c in conditionsModel.statements)
						{
							if(conditionsModel.statements[c].id==newVal)
							{
								model.selectedCondition = conditionsModel.statements[c];
							}
						}
					}
				}
			);
	 		
	 		//	dispatch an event when switching to the first tab
	 		//	(used by `sparkline` directive to update when switching back to tab containing 
	 		//	sparklines, in case data was added)
	 		//	TODO: consider moving to "mytrackercontroller" or similar
	 		$scope.onTabSelect = function(e)
	 		{
	 			$scope.setStatus();
	 			
	 			$rootScope.$broadcast('tabSelect');
	 		};
	 		
	 		$scope.deleteStatement = function(tracker)
	 		{
	 			$rootScope.$broadcast('deleteStatement',tracker);
	 			
	 			navigation.setLocation('home');
	 		};
	 		
	 		$scope.addStatement = function(tracker)
	 		{
	 			$rootScope.$broadcast('addStatement',tracker);
	 		};
	 		
	 		$scope.trackerAppliesToCondition = function(tracker)
	 		{
	 			if( model.selectedCondition == null )
	 			{
	 				var orphan = true;
	 				
	 				angular.forEach
	 				(
	 					conditionsModel.statements,
	 					function(statement)
	 					{
	 						if( statement.trackers.indexOf( tracker.code ) > -1 )
	 							orphan = false;
	 					}
	 				);
	 				
	 				return orphan;
	 			}
	 			
	 			if( model.selectedCondition == constants.CONDITION_ALL)
	 			{
	 				return true;
	 			}
	 			
	 			return model.selectedCondition && model.selectedCondition.trackers.indexOf( tracker.code ) > -1;
	 		};
	 		
	 		$scope.navigate = function(id)
	 		{
	 			return $scope.navigation.navigate(id);
	 		};
	 		
	 		$scope.getSectionsForIndex = function (index)
	 		{
	 			return $scope.model.sections[index] ? $scope.model.sections[index].sections : [];
	 		};
	 		
	 		$scope.showTrackerDetail = function($event,tracker)
	 		{
	 			$event.stopImmediatePropagation();
	 			
	 			model.selectedTrackerId = tracker.code;
	 			
	 			navigation.showPopup('record');
	 		};
	 		
	 		$scope.selectTab = function(tabId)
	 		{
	 			angular.forEach
	 			(
	 				model.tabs,
	 				function(tab)
	 				{
	 					tab.active=false;
	 				}
	 			);
	 			
	 			model.tabs[tabId].active=true;
	 		};
	 		
	 		$scope.setLocation = function(path)
	 		{
	 			$scope.navigation.setLocation(path);
	 			$scope.safeApply();
	 		};
	 		
	 		$scope.showPopup = function(id,closeCallback,dismissCallback)
	 		{
	 			$scope.isCollapsed = true;
	 			
	 			$scope.navigation.showPopup(id,closeCallback,dismissCallback);
	 		};
	 		
	 		$scope.setStatus = function(status)
			{
				status = typeof status != 'undefined' ? status : null;
				
				$scope.status = status;
			};
			
	 		$scope.safeApply = function()
			{
				var phase = this.$root.$$phase;
				if( phase == "$apply" || phase == "$digest" ) return;
				
				this.$apply();		
			};
			
			$scope.formatTrackerName = function(label, type)
			{
				var max = type == constants.TYPE_MEDICATION ? 11 : 20;
				if(label.length <= max) {
					return label;
				}
				else {
					return label.substring(0,max-1) + "..";
				}
			};
	 	}
	 ]
);

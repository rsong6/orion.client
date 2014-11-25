/*******************************************************************************
 * @license
 * Copyright (c) 2014 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/

define ([
	'marked/marked', //$NON-NLS-0$
	'orion/edit/editorContext'//$NON-NLS-0$
], function(Markdown, EditorContext) {

	function Hover(editor, hoverFactory) {
		this.editor = editor;
		this.hoverFactory = hoverFactory;
		this.inputManager = hoverFactory.inputManager;
		this.serviceRegistry = hoverFactory.serviceRegistry;
		this.commandRegistry = hoverFactory.commandRegistry;
	}
	
	Hover.prototype = {
		computeHoverInfo: function (context) {
			var hoverInfo = [];
			this.hoverFactory._applicableProviders.forEach(function(provider) {
				var providerImpl = this.serviceRegistry.getService(provider);
				if (providerImpl && providerImpl.computeHoverInfo) {
					var editorContext = EditorContext.getEditorContext(this.serviceRegistry);
					hoverInfo.push(providerImpl.computeHoverInfo(editorContext, context));
				}
			}.bind(this));

			return hoverInfo;
		},
		
		renderMarkDown: function(markDown) {
			return Markdown(markDown, {
				sanitize: true
			});
		},
				
		renderQuickFixes: function(annotation, parentDiv) {
			if  (!annotation || !parentDiv){
				return;
			}

			var actionsDiv = document.createElement("div"); //$NON-NLS-0$
			actionsDiv.className = "commandList"; //$NON-NLS-0$
			var metadata = this.inputManager.getFileMetadata();
			metadata.annotation = annotation;
			var nodeList = [];
			this.commandRegistry.renderCommands("orion.edit.quickfix", actionsDiv, metadata, this.editor, 'quickfix', annotation, nodeList); //$NON-NLS-1$ //$NON-NLS-0$
			delete metadata.annotation;
			
			if (nodeList.length > 0){
				var hr = document.createElement("hr"); //$NON-NLS-0$
				hr.style.borderStyle = "solid"; //$NON-NLS-0$
				hr.style.borderWidth = "1px 0 0 0"; //$NON-NLS-0$
				var descriptionDiv = document.createElement("div"); //$NON-NLS-0$
				descriptionDiv.style.marginLeft = '5px'; //$NON-NLS-0$
				descriptionDiv.style.marginTop = '5px'; //$NON-NLS-0$
				descriptionDiv.style.marginBottom = '5px'; //$NON-NLS-0$
				descriptionDiv.style.fontFamily = "";
				descriptionDiv.textContent = nodeList.length + " quick fixes available:"; // TODO NLS and have plural/singular text
				parentDiv.appendChild(hr);
				parentDiv.appendChild(descriptionDiv);
				parentDiv.appendChild(actionsDiv);
			}			
		}

	};

	function HoverFactory(serviceRegistry, inputManager, commandRegistry) {
		this.serviceRegistry = serviceRegistry;
		this.inputManager = inputManager;
		this.commandRegistry = commandRegistry;
		
		// Filter the plugins based on contentType...
		this.filterHoverPlugins();

		// Track changes to the input type and re-filter
		this.inputManager.addEventListener("InputChanged", function() { //$NON-NLS-0$
			this.filterHoverPlugins();
		}.bind(this));
	}
	HoverFactory.prototype = {
		createHover: function(editor) {
			return new Hover(editor, this);
		},
	
		filterHoverPlugins: function () {
			this._applicableProviders = [];
			var infoProviders = this.serviceRegistry.getServiceReferences("orion.edit.hover"); //$NON-NLS-0$
			for (var i = 0; i < infoProviders.length; i++) {
				var providerRef = infoProviders[i];
				var contentType = this.inputManager.getContentType();
				if (contentType) {
					var validTypes = providerRef.getProperty('contentType'); //$NON-NLS-0$
					if (validTypes && validTypes.indexOf(contentType.id) !== -1) {
						this._applicableProviders.push(providerRef);
					}
				}
			}
		}
	};

	return {HoverFactory: HoverFactory}; 
});



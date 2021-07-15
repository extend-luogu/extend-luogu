const log = (f, ...s) => console.log(`%c[novogui] ${f}`, "color: #d57870;", ...s)
let sto

let alwaysVisibile = "true"
let SettingType = {
	COMBOBOX: 0,
	SLIDER: 1,
	TEXTBOX: 2,
	SELECTBOX: 3,
	CHECKBOX: 4,
	COLOR: 5,
}

const Setting = class {
	constructor(parent, name, type, visibilityDependency) {
		this.parent = parent
		this.name = name
		this.type = type
		this.visibilityDependency = visibilityDependency
	}
}
const ComboboxSetting = class extends Setting {
	constructor(parent, name, acceptableValues, visibilityDependency) {
		super(parent, name, SettingType.COMBOBOX, visibilityDependency)
		this.acceptableValues = acceptableValues
	}
}
const SliderSetting = class extends Setting {
	constructor(
		parent,
		name,
		minValue,
		maxValue,
		increment,
		visibilityDependency
	) {
		super(parent, name, SettingType.SLIDER, visibilityDependency)
		this.minValue = minValue
		this.maxValue = maxValue
		this.increment = increment
	}
}
const TextboxSetting = class extends Setting {
	constructor(parent, name, visibilityDependency) {
		super(parent, name, SettingType.TEXTBOX, visibilityDependency)
	}
}
const CheckboxSetting = class extends Setting {
	constructor(parent, name, visibilityDependency) {
		super(parent, name, SettingType.CHECKBOX, visibilityDependency)
	}
}
const SelectboxSetting = class extends Setting {
	constructor(parent, name, acceptableValues, visibilityDependency) {
		super(parent, name, SettingType.SELECTBOX, visibilityDependency)
		this.acceptableValues = acceptableValues
	}
}
const ColorSetting = class extends Setting {
	constructor(parent, name, visibilityDependency) {
		super(parent, name, SettingType.COLOR, visibilityDependency)
	}
}
const Module = class {
	constructor(name, description, settings) {
		this.name = name
		this.description = description
		this.settings = settings
	}
}
let settings = new Map()
let moduleRegistry = []
const getNextSlider = sliderId => {
	switch (sliderId) {
	case "h":
		return "s"
	case "s":
		return "l"
	case "l":
		return "h"
	}
}
const checkboxChecked = setting => {
	return $("#" + setting + " > .checkbox-value").hasClass("checkbox-checked")
}
const getSliderValue = setting => {
	return $("#" + setting + " > .real-slider").val()
}
const getSelectboxValue = setting => {
	return $("#" + setting + " > .selectbox-value").text()
}
const selectboxHasItem = (setting, item) => {
	return $(
		"#" + setting + " > .combobox-items > li:contains('" + item + "')"
	).hasClass("selected-item")
}
const expandHandler = module => {
	let growDiv = $("#" + module + "-module > .module-settings-wrapper")
	let expander = $("#" + module + "-module > .module-header > .module-expand")
	if (growDiv.height()) {
		growDiv.height(0)
		expander.css("transform", "rotateX(0deg)")
	} else {
		let wrapper = $(
			"#" + module + "-module > .module-settings-wrapper > .module-settings"
		)
		growDiv.height(wrapper.height())
		expander.css("transform", "rotateX(180deg)")
	}
	return false
}
const forceUpdate = module => {
	let growDiv = $("#" + module + "-module > .module-settings-wrapper")
	let wrapper = $(
		"#" + module + "-module > .module-settings-wrapper > .module-settings"
	)
	growDiv.height(wrapper.height())
}
const toggleModule = module => {
	let moduleHeader = $("#" + module + "-module > .module-header")
	if (moduleHeader.hasClass("toggled-module")) {
		moduleHeader.removeClass("toggled-module")
		return false
	} else {
		moduleHeader.addClass("toggled-module")
		return true
	}
}
const registerModules = modules => {
	log("Registering modules")
	
	// Note: Need no AJAX.
	modules.forEach(category => {
		renderCategory(category)
		category.children.forEach(module => {
			let sets = new Map()
			moduleRegistry.push(module)
			if ("settings" in module)
				module.settings.forEach(setting => {
					let settingName = setting.name
					let visibilityDependency =
						"visibilityDependency" in setting
							? setting.visibilityDependency
							: alwaysVisibile
					switch (SettingType[setting.type]) {
					case SettingType.SELECTBOX:
						setting = new SelectboxSetting(
							module,
							setting.displayName,
							setting.acceptableValues,
							visibilityDependency
						)
						break
					case SettingType.COMBOBOX:
						setting = new ComboboxSetting(
							module,
							setting.displayName,
							setting.acceptableValues,
							visibilityDependency
						)
						break
					case SettingType.CHECKBOX:
						setting = new CheckboxSetting(
							module,
							setting.displayName,
							visibilityDependency
						)
						break
					case SettingType.TEXTBOX:
						setting = new TextboxSetting(
							module,
							setting.displayName,
							visibilityDependency
						)
						break
					case SettingType.SLIDER:
						setting = new SliderSetting(
							module,
							setting.displayName,
							setting.minValue,
							setting.maxValue,
							setting.increment,
							visibilityDependency
						)
						break
					case SettingType.COLOR:
						setting = new ColorSetting(
							module,
							setting.displayName,
							visibilityDependency
						)
						break
					}
					settings.set(settingName, setting)
					sets.set(settingName, setting)
				})
			renderModule(category, module)
		})
	})
	renderTextEditor()

	log("Rendered modules")
	registerHandlers()
}
const toggleClass = (element, name) => {
	if (element.hasClass(name)) {
		element.removeClass(name)
		return false
	} else {
		element.addClass(name)
		return true
	}
}
const renderTextEditor = () => {
	$(".clickgui").append(`<div class="textbox-editor"><textarea></textarea></div>`)
}
const renderCategory = category => {
	$(".clickgui").append(`
		<div id="${ category.name }-tab" class="panel">
			<div class="panel-header">
				<span class="panel-title">${ category.displayName }</span>
				${	/* Kill: Have no images now. */ "" &&
					`<img class="panel-icon" loading="lazy" src="?.png" />` }
			</div>
			<div class="panel-elements">
			</div>
		</div>
	`)
}
const renderModule = (category, module) => {
	let hasSetting = module.settings.length > 0
	$(`#${ category.name }-tab > .panel-elements`).append(`
		<div id="${ module.name }-module" class="module">
			<div class="module-header">
				<span class="module-title">${ module.name }</span>
				${ hasSetting ? `<span class="module-expand">v</span>` : "" }
			</div>
			<div class="module-settings-wrapper">
				${ hasSetting ? renderSettings(module) : "" }
			</div>
		</div>
	`)

	let header = $(`#${ module.name }-module > .module-header`)
	if (hasSetting)
		header.contextmenu(() => expandHandler(module.name))

	if (module.rawName[0] === "@") header.addClass("locked-module")
	else {
		if (sto[module.rawName].on) toggleModule(module.name) // Sto: load
		header.on("click", () => {
			sto[module.rawName].on = toggleModule(module.name) // Sto: save
		})
	}
}
const renderSettings = module => {
	let html = `<div class="module-settings">`
	module.settings.forEach(setting => {
		let val = sto[module.rawName][setting.name]

		switch (SettingType[setting.type]) {
		case SettingType.SELECTBOX:
			html += `
				<div id="${ setting.name }" class="setting selectbox-setting">
					<span class="setting-title">${ setting.displayName }</span>
					<span class="selectbox-value">${ val || setting.acceptableValues[0] /* Sto: load */ }</span>
				</div>
			`
			break
		case SettingType.COMBOBOX:
			html += `
				<div id="${ setting.name }" class="setting combobox-setting">
					<div class="combobox-wrapper">
						<span class="combobox-title">${ setting.displayName }</span>
					</div>
					<ul class="combobox-items collapsed-combobox">
						${ setting.acceptableValues.map(v => `<li>${v}</li>`).join("\n") }
					</ul>
				<div>
			`	
			break
		case SettingType.CHECKBOX:
			html += `
				<div id="${ setting.name }" class="setting checkbox-setting">
					<span class="setting-title">${ setting.displayName }</span>
					<div class="checkbox-value ${ val ? "checkbox-checked" : "" /* Sto: load */ }"></div>
				</div>
			`
			break
		case SettingType.TEXTBOX:
			/* Note: Avoid undefined placeholder. Support extending to text editor. */
			html += `
				<div id="${ setting.name }" class="setting textbox-setting">
					<span class="setting-title">${ setting.displayName }</span>
					<span class="textbox-at">@</span>
					<input type="text" class="textbox" value="${ val || "" }" />
				</div>
			`
			break
		case SettingType.SLIDER:
			html += `
				<div id="${ setting.name }" class="setting textbox-setting">
					<input type="range" class="display-slider"
						min="${ setting.minValue }" max="${ setting.maxValue }" step="${ setting.increment }"
						value="${ val || setting.minValue }" disabled
					/>
					<input type="range" class="real-slider"
						min="${ setting.minValue }" max="${ setting.maxValue }" step="${ setting.increment }"
						value="${ val || setting.minValue }"
					/>
					<div class="slider-value-holder">
						<span class="setting-title">${ setting.displayName }</span>
						<span class="slider-value">${ val || setting.minValue /* Sto: load */ }</span>"
					</div>
				</div>
			`
			break
		// TODO
		case SettingType.COLOR:
			html += '<div class="setting color-setting" id="' + setting.name + '">'
			html += '<div class="sliders" slider="h">'
			html += '<input type="range" class="color-slider h-slider" min="1" max="360" disabled>'
			html += '<input type="range" class="real-color-slider real-h-slider" min="0" max="360" slider="h">'
			html += '<input type="range" class="color-slider s-slider disabled-color-slider" min="0" max="100" disabled>'
			html += '<input type="range" class="real-color-slider real-s-slider disabled-color-slider" min="0" max="100" slider="s">'
			html += '<input type="range" class="color-slider l-slider disabled-color-slider" min="0" max="100" disabled>'
			html += '<input type="range" class="real-color-slider real-l-slider disabled-color-slider" min="0" max="100" slider="l">'
			html += '<span class="setting-title">' + setting.displayName + "</span>"
			html += "</div></div>"
			break
		}
	})
	return html
}
const refreshSettingVisiblity = module => {
	if ("settings" in module)
		module.settings.forEach(setting => {
			if (eval(setting.visibilityDependency) == false) {
				$("#" + setting.name).addClass("setting-disabled")
			} else {
				$("#" + setting.name).removeClass("setting-disabled")
			}
		})
}
const refreshSettings = module => {
	refreshSettingVisiblity(module)
	forceUpdate(module.name)
}
const getHSLColorFromSetting = setting => {
	let h = $("#" + setting + " > .sliders > .real-h-slider").val()
	let s = $("#" + setting + " > .sliders > .real-s-slider").val()
	let l = $("#" + setting + " > .sliders > .real-l-slider").val()
	return "hsl(" + h + ", " + s + ", " + l + ")"
}
const registerHandlers = () => {
	moduleRegistry.forEach(refreshSettingVisiblity)

	$(".real-slider").on("input", e => {
		let that = e.currentTarget
		let id = $(that).parent().attr("id")
		let setting = settings.get(id)
		$("#" + id + " > .display-slider").val(that.value)
		$("#" + id + " > .slider-value-holder > .slider-value").html(that.value)
		refreshSettings(setting.parent)

		sto[setting.parent.rawName][id] = + that.value // Sto: save
	})

	$(".combobox-items > li").on("click", e => {
		let element = $(e.target)
		let id = $(e.currentTarget).parent().parent().attr("id")
		let setting = settings.get(id)
		toggleClass(element, "selected-item")
		refreshSettings(setting.parent)

		// TODO Sto: save
	})
	$(".combobox-wrapper").on("click", e => {
		let id = $(e.currentTarget).parent().attr("id")
		toggleClass($("#" + id + " > .combobox-items"), "collapsed-combobox")
		let module = $(e.currentTarget).parent().parent().parent().parent().attr("id").split("-")[0]
		forceUpdate(module)
	})

	$(".selectbox-value").on("click", e => {
		let that = e.currentTarget
		let name = that.parentElement.id
		let setting = settings.get(name)
		let value = $(that)
		let i = setting.acceptableValues.indexOf(value.text())
		i = ++i == setting.acceptableValues.length ? 0 : i
		let val = setting.acceptableValues[i]
		value.text(val)
		refreshSettings(setting.parent)

		sto[setting.parent.rawName][name] = val // Sto: save
	})

	$(".textbox").on("change", e => {
		let that = e.currentTarget
		let name = that.parentElement.id
		let setting = settings.get(name)
		
		sto[setting.parent.rawName][name] = that.value // Sto: save
	})
	$(".textbox-at").on("click", e => {
		let at = $(e.currentTarget)
		let text = at.next(".textbox")
		let editor = $(".textbox-editor > textarea")

		if (toggleClass(at, "textbox-extended")) {
			text.attr("disabled", true)
			editor.val(text.val())
		} else {
			text.attr("disabled", false)
			text.val(editor.val()).change()
		}
	})

	$(".checkbox-value").parent().on("click", e => {
		// Note: Larger clicking area.
		let name = e.currentTarget.id
		let element = $(e.currentTarget).children(".checkbox-value")
		let setting = settings.get(name)
		let val = toggleClass(element, "checkbox-checked")
		refreshSettings(setting.parent)

		sto[setting.parent.rawName][name] = val // Sto: save
	})

	$(".sliders").contextmenu(e => {
		let id = $(e.target).parent().parent().attr("id")
		let slider = $(e.target).parent().attr("slider")
		let next = getNextSlider(slider)
		$(e.target).parent().attr("slider", next)
		$(`#${id} > .sliders > .${slider}-slider`).addClass("disabled-color-slider")
		$(`#${id} > .sliders > .real-${slider}-slider`).attr("disabled", true).addClass("disabled-color-slider")
		$(`#${id} > .sliders > .${next}-slider`).removeClass("disabled-color-slider")
		$(`#${id} > .sliders > .real-${next}-slider`).attr("disabled", false).removeClass("disabled-color-slider")

		return false
	})

	// TODO
	$(".real-color-slider").on("input", e => {
		let that = e.currentTarget
		let slider = $(that).attr("slider")
		let id = $(that).parent().parent().attr("id")
		$("#" + id + " > .sliders > ." + slider + "-slider").val(that.value)
		if (slider == "h") {
			$("#" + id + " > .sliders > .s-slider").css(
				"background-color",
				"hsl(" + that.value + ", 100%, 50%)"
			)
			$("#" + id + " > .sliders > .l-slider").css(
				"background-color",
				"hsl(" + that.value + ", 100%, 50%)"
			)
		}
	})
	$(".real-h-slider").each((_, that) => {
		let id = $(that).parent().parent().attr("id")
		$("#" + id + " > .sliders > .s-slider").css(
			"background-color",
			"hsl(" + that.value + ", 100%, 50%)"
		)
		$("#" + id + " > .sliders > .l-slider").css(
			"background-color",
			"hsl(" + that.value + ", 100%, 50%)"
		)
	})
}

window.novogui = {
	log,
	init(modules) {
		window.novogui._ = modules
		
		const sb = $(`
			<iframe src="https://www.luogu.com.cn/robots.txt?type=dash"></iframe>
		`).hide().appendTo($("body"))

		window.addEventListener("message", e => {
			log("Listening dash storage loading: %o", e.data)
			sto = window.exlg.TM_dat.load_dat(window.exlg.mod.data, true, e.data)

			const dat = window.exlg.TM_dat.load_dat.dat
			window.exlg.TM_dat.save_dat = () => {
				log("Asking dash storage saving: %o", dat)
				sb[0].contentWindow.postMessage(dat, "*")
			}

			registerModules(modules)
		})
	}
}


module.exports = {
	debug: false,
	itemTy: o => o.concat("MHDU".split("")),
	checker: {
		itemTy: N => {
		if (N.l === 3 && N.c === "-")
			throw `is root item, so shouldn't be "-" type`
		}
	}
}


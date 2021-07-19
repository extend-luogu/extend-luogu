module.exports = {
	debug: false,
	itemTy: o => o.concat("".split("MHD")),
	checker: {
		itemTy: N => {
		if (N.l === 3 && N.c === "-")
			throw `is root item, so shouldn't be "-" type`
		}
	}
}


const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (err) {
        console.log(err)
        // for direclty adding the validate error message in the err.message 
        // avoiding the multiple validation error messages in one message and als avoiding the "validation_error" prefix
        if (
            (err?.errors?.length > 0)
            && (err?.errors[0]?.type == "Validation error" ||
                err?.errors[0]?.type == "notNull Violation" ||
                err?.errors[0]?.type == "unique violation"
            )
        ) {
            err.code = err.errors[0].type.replace(/ /g, "_").toUpperCase()
            err.message = "Validation failed for one or many fields"
            err.errors = err.errors.map(e => {
                return {
                    message: e.message,
                    code: e.path.toUpperCase() + "_" + err.code,
                    field: e.path.replace(e.path.split("_")[0] + "_", ""),
                }
            })
        }


        res.status(err?.statusCode || 500).json({
            statusCode: err?.statusCode || 500,
            success: false,
            message: err?.message,
            code: err?.code,
            errors: err?.errors,
        })
    }
}

export { asyncHandler }
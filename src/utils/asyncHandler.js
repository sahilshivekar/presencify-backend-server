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
            err.message = err.errors[0].message
        }

        res.status(err?.statusCode || 500).json({
            statusCode: err?.statusCode || 500,
            success: false,
            message: err?.message
        })
    }
}

export { asyncHandler }
import React from "react"
import PropTypes from "prop-types"
import { TextField } from "@mui/material"

const FileUploadField = ({ onChange, label = "Upload File", ...props }) => {
  return (
    <TextField
      type="file"
      onChange={(e) => onChange(e.target.files[0])}
      label={label}
      InputLabelProps={{ shrink: true }}
      fullWidth
      {...props}
    />
  )
}
FileUploadField.propTypes = {
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
}


export default FileUploadField

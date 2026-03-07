import React, { useEffect, useState, useRef } from "react";
import { AppstoreAddOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createTutorial, getProfileData } from "../../../store/actions";
import { useFirebase, useFirestore } from "react-redux-firebase";
import { useHistory } from "react-router-dom";
import Button from "@mui/material/Button";
import { Alert, Box, Chip } from "@mui/material";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import { IconButton } from "@mui/material";
import Modal from "@mui/material/Modal";
import Avatar from "@mui/material/Avatar";
import { makeStyles } from "@mui/styles";
import { deepPurple } from "@mui/material/colors";
import { Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DescriptionIcon from "@mui/icons-material/Description";
import MovieIcon from "@mui/icons-material/Movie";
import Select from "react-select";
import { common } from "@mui/material/colors";
import CloseIcon from "@mui/icons-material/Close";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    paddingTop: "8px",
    paddingBottom: "10px"
  },
  item: {
    margin: "10px"
  },
  purple: {
    color: deepPurple[700],
    backgroundColor: deepPurple[500]
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1rem",
    marginBottom: "1rem"
  },
  chip: {
    margin: theme.spacing(0.5)
  },
  button: {
    marginLeft: theme.spacing(1),
    padding: "0.4rem 0.4rem"
  }
}));

const NewTutorial = ({ viewModal, onSidebarClick, viewCallback, active }) => {
  const firebase = useFirebase();
  const firestore = useFirestore();
  const dispatch = useDispatch();
  const history = useHistory();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [formValue, setformValue] = useState({
    title: "",
    summary: "",
    owner: "",
    tags: [],
    media: []
  });

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);

  const loadingProp = useSelector(
    ({
      tutorials: {
        create: { loading }
      }
    }) => loading
  );
  const errorProp = useSelector(
    ({
      tutorials: {
        create: { error }
      }
    }) => error
  );

  useEffect(() => {
    setLoading(loadingProp);
  }, [loadingProp]);

  useEffect(() => {
    setError(errorProp);
  }, [errorProp]);

  useEffect(() => {
    setformValue(prev => ({
      ...prev,
      tags: tags
    }));
  }, [tags]);


  const profileState = useSelector(state => state.profile.data);
  
const { organizations, isEmpty } = profileState || { organizations: null, isEmpty: false };

useEffect(() => {
  const isFetchProfile = organizations === null && !isEmpty;

  if (isFetchProfile) {
    getProfileData()(firebase, firestore, dispatch);
  }
}, [firestore, firebase, dispatch, organizations, isEmpty]);

  const displayName = useSelector(
    ({
      firebase: {
        profile: { displayName }
      }
    }) => displayName
  );

  const allowOrgs = organizations && organizations.length > 0;

  const orgList =
    allowOrgs
      ? organizations
          .map((org, i) => {
            if (org.permissions.includes(3) || org.permissions.includes(2)) {
              return org;
            } else {
              return null;
            }
          })
          .filter(Boolean)
      : [];

  useEffect(() => {
    setTags([]);
    setNewTag("");
    setMediaFiles([]);
    setformValue({
      title: "",
      summary: "",
      owner: "",
      tags: [],
      media: []
    });
    setVisible(viewModal);
  }, [viewModal]);

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaUploading(true);
    try {
      const cloudName = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const resourceType = type === "video" ? "video" : "auto";

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        const mediaMeta = {
          type,
          url: data.secure_url,
          name: file.name,
          thumbnail: type === "image" ? data.secure_url :
                      type === "video" ? data.secure_url.replace("/upload/", "/upload/so_0/") : "",
          uploadedAt: new Date().toISOString()
        };

        setMediaFiles(prev => [...prev, mediaMeta]);
        setformValue(prev => ({
          ...prev,
          media: [...(prev.media || []), mediaMeta]
        }));
      } else {
        console.error("Cloudinary upload failed: ", data);
      }
    } catch (err) {
      console.error("Media upload failed: ", err);
    }
    setMediaUploading(false);
    e.target.value = "";
};

  const handleRemoveMedia = index => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setformValue(prev => ({
      ...prev,
      media: (prev.media || []).filter((_, i) => i !== index)
    }));
  };

  const userHandle = useSelector(
  ({
    firebase: {
      profile: { handle }
    }
  }) => handle
);
  const onSubmit = formData => {
    formData.preventDefault();
    const tutorialData = {
      ...formValue,
        owner: formValue.owner || userHandle,
        created_by: userHandle,
        is_org: userHandle !== formValue.owner,
      completed: false
    };
    console.log(tutorialData);
    createTutorial(tutorialData)(firebase, firestore, dispatch, history);
  };

  const onOwnerChange = value => {
    setformValue(prev => ({
      ...prev,
      owner: value
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;

    setformValue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleDeleteTag = tagToDelete => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const classes = useStyles();
  return (
    <Modal
      open={visible}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        data-testId="tutorialNewModal"
        style={{
          height: "auto",
          width: "auto",
          background: "white",
          padding: "2rem",
          paddingTop: "1rem",
          maxWidth: "40%"
        }}
      >
        {error && (
          <Alert message={""} type="error" closable="true" className="mb-24">
            description={"Tutorial Creation Failed"}
          </Alert>
        )}
        <Typography variant="h5">Create a Tutorial</Typography>
        <Box
          sx={{
            py: 2,
            width: "50%"
          }}
        >
          <Typography>
            <Select
              options={orgList?.map(org => ({
                value: org.org_handle,
                label: org.org_name
              }))}
              onChange={data => {
                onOwnerChange(data.value);
              }}
              placeholder="Select Organisations"
              id="orgSelect"
            />
          </Typography>
        </Box>

        <form id="tutorialNewForm">
          <TextField
            prefix={
              <AppstoreAddOutlined style={{ color: "rgba(0,0,0,.25)" }} />
            }
            placeholder="Title of the Tutorial"
            autoComplete="title"
            name="title"
            variant="outlined"
            fullWidth
            data-testId="newTutorial_title"
            id="newTutorialTitle"
            style={{ marginBottom: "2rem" }}
            onChange={e => handleChange(e)}
          />

          <TextField
            prefix={
              <AppstoreAddOutlined style={{ color: "rgba(0,0,0,.25)" }} />
            }
            fullWidth
            variant="outlined"
            name="summary"
            placeholder="Summary of the Tutorial"
            autoComplete="summary"
            id="newTutorialSummary"
            data-testId="newTutorial_summary"
            onChange={e => handleChange(e)}
            style={{ marginBottom: "2rem" }}
          />

          <TextField
            label="Enter a tag"
            variant="outlined"
            size="small"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={handleAddTag}
          >
            Add Tag
          </Button>

          <div className={classes.tagsContainer}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                className={classes.chip}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => handleMediaUpload(e, "image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: "none" }}
            onChange={e => handleMediaUpload(e, "video")}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: "none" }}
            onChange={e => handleMediaUpload(e, "document")}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
            <IconButton
              onClick={() => imageInputRef.current.click()}
              title="Upload Image"
              disabled={mediaUploading}
            >
              <ImageIcon />
            </IconButton>
            <IconButton
              onClick={() => videoInputRef.current.click()}
              title="Upload Video"
              disabled={mediaUploading}
            >
              <MovieIcon />
            </IconButton>
            <IconButton
              onClick={() => docInputRef.current.click()}
              title="Upload Document"
              disabled={mediaUploading}
            >
              <DescriptionIcon />
            </IconButton>
            {mediaUploading && (
              <Typography variant="caption" color="primary">
                Uploading...
              </Typography>
            )}
          </Box>

          {mediaFiles.length > 0 && (
            <Box
              sx={{
                mt: 1,
                mb: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: 1
              }}
            >
              {mediaFiles.map((media, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    p: 0.5,
                    maxWidth: 120
                  }}
                >
                  {media.type === "image" && (
                    <img
                      src={media.url}
                      alt={media.name}
                      style={{
                        width: "100%",
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 4
                      }}
                    />
                  )}
                  {media.type === "video" && (
                    <video
                      src={media.url}
                      style={{ width: "100%", height: 80, borderRadius: 4 }}
                    />
                  )}
                  {media.type === "document" && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 80,
                        gap: 0.5
                      }}
                    >
                      <DescriptionIcon color="action" />
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{ maxWidth: 100 }}
                        title={media.name}
                      >
                        {media.name}
                      </Typography>
                    </Box>
                  )}

                  <IconButton
                    size="small"
                    onClick={() => handleRemoveMedia(index)}
                    sx={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      bgcolor: "white",
                      border: "1px solid #e0e0e0",
                      p: 0.2,
                      "&:hover": { bgcolor: "#f5f5f5" }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <div className="mb-0">
            <div style={{ float: "right" }}>
              <Button
                key="back"
                onClick={() => {
                  onSidebarClick();
                  setTags([]);
                  setNewTag("");
                  setMediaFiles([]);
                  setformValue({
                    title: "",
                    summary: "",
                    owner: "",
                    tags: [],
                    media: []
                  });
                }}
                id="cancelAddTutorial"
              >
                Cancel
              </Button>
              <Button
                key="submit"
                type="primary"
                variant="contained"
                color="secondary"
                htmlType="submit"
                loading={loading}
                onClick={e => onSubmit(e)}
                data-testid="newTutorialSubmit"
                sx={{
                  bgcolor: "#03AAFA",
                  borderRadius: "30px",
                  color: common.white,
                  "&:hover": {
                    bgcolor: "#03AAFA"
                  }
                }}
                disabled={
                  formValue.title === "" ||
                  formValue.summary === "" ||
                  mediaUploading
                }
              >
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewTutorial;

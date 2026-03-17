import React, { useEffect, useState } from "react";
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

interface Organization {
  org_handle: string;
  org_name: string;
  permissions: number[];
}

interface FormValue {
  title: string;
  summary: string;
  owner: string;
  tags: string[];
}

interface NewTutorialProps {
  viewModal: boolean;
  onSidebarClick: () => void;
  viewCallback?: () => void;
  active?: boolean;
}

interface RootState {
  tutorials: {
    create: {
      loading: boolean;
      error: boolean;
    };
  };
  firebase: {
    profile: {
      displayName: string;
      handle: string;
    };
  };
  profile: {
    data: {
      organizations: Organization[] | null;
      isEmpty: boolean;
    } | null;
  };
}

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
    margin: "0.5",
  },
  button: {
    marginLeft: "1",
    padding: "0.4rem 0.4rem"
  }
}));

const NewTutorial: React.FC<NewTutorialProps> = ({ viewModal, onSidebarClick, viewCallback, active }) => {
  const firebase = useFirebase();
  const firestore = useFirestore();
  const dispatch = useDispatch();
  const history = useHistory();

  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");
  const [formValue, setformValue] = useState<FormValue>({
    title: "",
    summary: "",
    owner: "",
    tags: []
  });

  const loadingProp = useSelector((state: RootState) => state.tutorials.create.loading);
  const errorProp = useSelector((state: RootState) => state.tutorials.create.error);

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

  const profileState = useSelector((state: RootState) => state.profile.data);
  
const { organizations, isEmpty } = profileState || { organizations: null, isEmpty: false };

useEffect(() => {
  const isFetchProfile = organizations === null && !isEmpty;
  
  if (isFetchProfile) {
    getProfileData()(firebase, firestore, dispatch);
  }
}, [firestore, firebase, dispatch, organizations, isEmpty]);

  const displayName = useSelector((state: RootState) => state.firebase.profile);

  const userHandle = useSelector((state: RootState) => state.firebase.profile.handle);

  const allowOrgs: boolean = !!(organizations && organizations.length > 0);

  const orgList: Organization[] = allowOrgs
    ? organizations!
        .map((org: Organization) => {
          if (org.permissions.includes(3) || org.permissions.includes(2)) {
            return org;
          }
          return null;
        })
        .filter((org): org is Organization => org !== null)
    : [];

  useEffect(() => {
    setTags([]);
    setNewTag("");
    setformValue({
      title: "",
      summary: "",
      owner: "",
      tags: []
    });
    setVisible(viewModal);
  }, [viewModal]);

  const onSubmit = (formData: React.MouseEvent): void => {
    formData.preventDefault();
    const tutorialData = {
      ...formValue,
      owner: formValue.owner || userHandle,
      created_by: userHandle,
      is_org: userHandle !== formValue.owner,
      completed: false
    };
    createTutorial(tutorialData)(firebase, firestore, dispatch, history);
  };

  const onOwnerChange = (value: string): void => {
    setformValue(prev => ({
      ...prev,
      owner: value
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setformValue(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = (): void => {
    if (newTag.trim() !== "") {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleDeleteTag = (tagToDelete: string): void => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const classes = useStyles();

  return (
    <Modal
      open={visible}
      onClose={onSidebarClick}
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
          <Alert severity="error" className="mb-24">
            Tutorial Creation Failed
          </Alert>
        )}

        <Typography variant="h5">Create a Tutorial</Typography>

        <Box sx={{ py: 2, width: "50%" }}>
          <Typography>
            <Select
              options={orgList.map((org: Organization) => ({
                value: org.org_handle,
                label: org.org_name
              }))}
              onChange={data => {
                if (data) onOwnerChange(data.value);
              }}
              placeholder="Select Organisation"
              id="orgSelect"
            />
          </Typography>
        </Box>

        <form id="tutorialNewForm">
          <TextField
            placeholder="Title of the Tutorial"
            autoComplete="title"
            name="title"
            variant="outlined"
            fullWidth
            data-testId="newTutorial_title"
            id="newTutorialTitle"
            style={{ marginBottom: "2rem" }}
            onChange={e => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
          />

          <TextField
            fullWidth
            variant="outlined"
            name="summary"
            placeholder="Summary of the Tutorial"
            autoComplete="summary"
            id="newTutorialSummary"
            data-testId="newTutorial_summary"
            onChange={e => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
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
            {tags.map((tag: string, index: number) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
                className={classes.chip}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </div>

          <IconButton>
            <ImageIcon />
          </IconButton>
          <IconButton>
            <MovieIcon />
          </IconButton>
          <IconButton>
            <DescriptionIcon />
          </IconButton>

          <div className="mb-0">
            <div style={{ float: "right" }}>
              <Button
                key="back"
                onClick={() => {
                  onSidebarClick();
                  setTags([]);
                  setNewTag("");
                  setformValue({
                    title: "",
                    summary: "",
                    owner: "",
                    tags: []
                  });
                }}
                id="cancelAddTutorial"
              >
                Cancel
              </Button>
              <Button
                key="submit"
                type="submit"
                variant="contained"
                color="secondary"
                onClick={e => onSubmit(e)}
                data-testid="newTutorialSubmit"
                sx={{
                  bgcolor: "#03AAFA",
                  borderRadius: "30px",
                  color: common.white,
                  "&:hover": { bgcolor: "#03AAFA" }
                }}
                disabled={
                  formValue.title === "" ||
                  formValue.summary === "" ||
                  formValue.owner === ""
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
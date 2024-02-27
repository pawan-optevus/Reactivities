import { useEffect, useState } from "react";
import axios from "axios";
import { Container } from "semantic-ui-react";
import { Activity } from "../models/activity";
import NavBar from "./NavBar";
import ActivityDashboard from "../../features/activities/dashboard/ActivityDashboard";
import { v4 as uuid } from "uuid";

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<
    Activity | undefined
  >(undefined);
  const [editMode, setEditMode] = useState(false);

  function handleSelectedActivity(id: string) {
    setSelectedActivity(activities.find(a => a.id === id));
  }

  function handleCancelSelectedActivity() {
    setSelectedActivity(undefined);
  }

  function handleFormOpen(id?: string) {
    console.log(id);
    id ? handleSelectedActivity(id) : handleCancelSelectedActivity(); // is equivalent to if (id) handleSelectedActivity(id), id is NEVER null
    setEditMode(true);
  }

  function handleFormClose() {
    setEditMode(false);
  }

  function handleCreateOrEditActivity(activity: Activity) {
    /* using uuid() for generating a random Guid for our id property */
    activity.id
      ? setActivities([
          ...activities.filter(x => x.id !== activity.id),
          activity,
        ])
      : setActivities([...activities, { ...activity, id: uuid() }]);
    setEditMode(false);
    setSelectedActivity(activity);
  }

  useEffect(() => {
    axios
      .get<Activity[]>("http://localhost:5000/api/activities")
      .then(response => {
        setActivities(response.data);
      });
  }, []);

  return (
    <>
      <NavBar onFormOpen={handleFormOpen} />
      <Container style={{ marginTop: "7rem" }}>
        <ActivityDashboard
          onCreateOrEditActivity={handleCreateOrEditActivity}
          activities={activities}
          selectedActivity={selectedActivity}
          onHandleSelectedActivity={handleSelectedActivity}
          onHandleCancelSelectedActivity={handleCancelSelectedActivity}
          editMode={editMode}
          onFormOpen={handleFormOpen}
          onFormClose={handleFormClose}
        />
      </Container>
    </>
  );
}

export default App;

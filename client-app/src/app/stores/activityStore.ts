/* MobX is mutable so don't confuse this with redux. We can mutate the state directly here. */

import { Activity } from "../models/activity";
import agent from "../api/agent";
import { v4 as uuid } from "uuid";
import { makeAutoObservable } from "mobx";

export default class ActivityStore {
  // Observables
  activityRegistry = new Map<string, Activity>();
  selectedActivity: Activity | undefined = undefined;
  editMode = false;
  loading = false;
  loadingInitial = false;

  constructor() {
    makeAutoObservable(this);
  }

  get activitiesByDate() {
    return Array.from(this.activityRegistry.values()).sort(
      (a, b) => Date.parse(a.date) - Date.parse(b.date)
    );
  }

  get groupedActivities() {
    const init = {} as { [key: string]: Activity[] };

    return this.activitiesByDate.reduce((acc, activity) => {
      const date = activity.date;
      acc[date] = acc[date] ? [...acc[date], activity] : [activity];
      return acc;
    }, init);
  }

  // Actions
  loadActivities = async () => {
    this.setLoadingInitial(true);
    try {
      const response = await agent.Activites.list();

      /* Every step (tick) that updates observables in an asynchronous process should be marked as action. (docs)
      That can be done in two ways:
        1. Using runInAction() */
      // runInAction(() => {
      // this.activities = response.map(activity => {
      //   const date = activity.date.split("T")[0];
      //   return { ...activity, date };
      // });
      // });

      /* 2. Or we can simply modularise the different steps(ticks) inside separate actions of their own */
      response.forEach(activity => {
        this.setActivity(activity);
      });
    } catch (error) {
      console.log(error);
    } finally {
      this.setLoadingInitial(false);
    }
  };

  setActivity = (activity: Activity) => {
    activity.date = activity.date.split("T")[0];
    this.activityRegistry.set(activity.id, activity);
  };

  setLoadingInitial = (state: boolean) => {
    this.loadingInitial = state;
  };

  createActivity = async (activity: Activity) => {
    this.loading = true;
    activity.id = uuid();
    try {
      await agent.Activites.create(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  updateActivity = async (activity: Activity) => {
    this.loading = true;
    try {
      await agent.Activites.update(activity);
      runInAction(() => {
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false;
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  deleteActivity = async (id: string) => {
    this.loading = true;
    try {
      await agent.Activites.delete(id);
      runInAction(() => {
        this.activityRegistry.delete(id);
      });
    } catch (error) {
      console.log(error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  };

  loadActivity = async (id: string) => {
    const activity = this.getActivity(id);
    if (activity) {
      this.selectedActivity = activity;
      return activity;
    } else {
      this.setLoadingInitial(true);
      try {
        // await this.loadActivities();
        const activityDetail = await agent.Activites.details(id);
        this.setActivity(activityDetail);
        this.setSelectedActivity(activityDetail);
        return activityDetail;
      } catch (error) {
        console.log(error);
      } finally {
        this.setLoadingInitial(false);
      }
    }
  };

  private getActivity = (id: string) => {
    return this.activityRegistry.get(id);
  };

  private setSelectedActivity = (activity: Activity) => {
    this.selectedActivity = activity;
  };
}

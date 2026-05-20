import { TaskList } from "../components/TaskList";
import { TaskListHeader } from "../components/TaskListHeader";

export function TasksPage() {
  return (
    <>
      <TaskListHeader />
      <TaskList />
    </>
  );
}

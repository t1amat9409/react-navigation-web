const createHistory = require('history').createBrowserHistory;
const queryString = require('query-string');

const NavigationActions = require('react-navigation').NavigationActions;
const addNavigationHelpers = require('react-navigation').addNavigationHelpers;

const history = createHistory();

const getPathAndParamsFromLocation = location => {
  const path = location.pathname.substr(1);
  const params = queryString.parse(location.search);
  return { path, params };
};

const matchPathAndParams = (a, b) => {
  console.log('comparing and b', a, b);
  if (a.path !== b.path) {
    console.log('path not match');
    return false;
  }
  if (queryString.stringify(a.params) !== queryString.stringify(b.params)) {
    console.log('params not match');

    return false;
  }
  console.log('match success');

  return true;
};

let currentPathAndParams = getPathAndParamsFromLocation(history.location);

exports.createBrowserApp = App => {
  const setHistoryListener = dispatch => {
    history.listen(location => {
      const pathAndParams = getPathAndParamsFromLocation(location);
      console.log('HIST OBSERVED', pathAndParams);
      if (matchPathAndParams(pathAndParams, currentPathAndParams)) {
        return;
      }
      currentPathAndParams = pathAndParams;
      const action = App.router.getActionForPathAndParams(
        pathAndParams.path,
        pathAndParams.params,
      );
      console.log('Dispatching via history', action, pathAndParams);
      dispatch(action);
    });
  };

  const initAction =
    App.router.getActionForPathAndParams(
      currentPathAndParams.path,
      currentPathAndParams.params,
    ) || NavigationActions.init();

  class WebApp extends React.Component {
    state = { nav: App.router.getStateForAction(initAction) };
    componentDidMount() {
      setHistoryListener(this._dispatch);
    }
    render() {
      return (
        <App
          navigation={addNavigationHelpers({
            state: this.state.nav,
            dispatch: this._dispatch,
            addListener: () => {},
          })}
        />
      );
    }
    _dispatch = action => {
      const newState = App.router.getStateForAction(action, this.state.nav);
      if (newState && newState !== this.state.nav) {
        this.setState({ nav: newState });
        const pathAndParams = App.router.getPathAndParamsForState(newState);
        if (!matchPathAndParams(pathAndParams, currentPathAndParams)) {
          console.log('Pushing via dispatch', pathAndParams);
          currentPathAndParams = pathAndParams;
          history.push(
            `/${pathAndParams.path}?${queryString.stringify(
              pathAndParams.params,
            )}`,
          );
        }
      }
    };
  }
  return WebApp;
};

---
title: 一起来实现一个简单的 React Router 吧~
author: Siky
description: 本质上，前端路由所提供的，就是一个 修改 URL 及 渲染与 URL 对应组件 的功能集合。那要怎么实现它呢？
crtime: 2023-02-07T20:54:13.000Z
uptime: 1782447655845
tags: 'JavaScript,React,Router'
heroImage: ../assets/simple-react-router.png
---

本质上，前端路由所提供的，就是一个 `修改 URL` 及 `渲染与 URL 对应组件` 的功能集合。

## 功能分析

首先来看下 `Router` 实现的基础功能：
1. 修改 URL ；
2. 监听 URL 的变化，并根据新的 URL 来匹配对应的路由组件进行渲染；

### 如何修改 URL ？
修改 URL 很容易，用 `a` 标签或者修改 `window.location.href` 都可以实现。但用这些方法修改 URL 后，浏览器会向服务端发送请求，引起页面的刷新。这不符合 `Router` 功能的需求。

但通过以下两个办法，可以做到修改 URL 且不发送请求：
1. 修改 `hash` ；
2. 通过 `history` 的 `pushState`，`replaceState`，`go` 这几个 API 来修改 URL ；

可以发现，上面两种修改 URL 的方式，刚好对应了 React-Router-Dom 的两种模式： `Hash模式` 和 `History模式` 。

### 如何监听 URL 变化并匹配路由？
1. 页面跳转或刷新后，即新打开页面时：遍历所有路由组件，将 `location.pathname === path` 的路由组件渲染出来即可；
2. 若是通过 `history` API 修改的 URL ，则可以在修改 URL 时，同步调用匹配路由的方法，以触发匹配；当然更好的方法时单独管理一份 `location` 的状态，修改 URL 时更新该 `location` 状态，所有引用该状态的路由组件，自动触发重新渲染，进而自动重新匹配。

下面是这个过程的一个流程图

![image.png](./../assets/simple-react-router-1.png)

下面将通过 `history` API 来实现一个基础的 `History模式` 的 `Router` 功能，并支持如下路由配置：

``` javascript
const routes = [
  {
    path: '/aa',
    component: <AA />,
  },
  {
    path: '/bb',
    component: <BB />,
  },
  {
    path: '/cc',
    component: <CC />,
  },
  {
    path: '/dd',
    component: <DD />,
  },
]
```

# 简易实现

对于上述的 routes 配置，搭配如下代码结构进行演示。

``` javascript
export default function App() {

  // 匹配成功后，需要渲染的组件
  const [content, useContent] = useContent(null)

  //...

  return (
    <>
      <div className="menu">
        <ul>
          <li><a href="/aa" onClick={handleLink}>AA</a></li>
          <li><a href="/bb" onClick={handleLink}>BB</a></li>
          <li><a href="/cc" onClick={handleLink}>CC</a></li>
          <li><a href="/dd" onClick={handleLink}>DD</a></li>
        </ul>
      </div>
      <div className="content">
        {content}
      </div>
    </>
  )
}
```

## 实现 handleLink

前面功能分析时说过，路由的第一个功能点是修改 URL ，而 `handleLink` 方法的目的，就是修改 URL 。

`handleLink` 方法，是绑定在 `a` 标签上的，点击 `a` 标签的默认行为，会造成浏览器发起请求进而刷新页面，不符合前端路由的需求。所以这里用 `event.preventDefault()` 来禁止默认行为；

禁用默认行为后，再通过 `history.pushState` 方法修改 URL ；

URL 被修改后，需要同步调用匹配路由的方法，以渲染匹配的路由组件，这里给该方法取名为 `refresh` ，意为匹配路由并渲染。

代码如下：

``` javascript
function handleLink(e) {
  e.preventDefault()
  window.history.pushState({}, '', e.target.href)
  refresh()
}
```

## 实现 refresh

匹配路由并渲染的过程如下：
1. 获取当前 URL 的 path；
2. 通过 path 跟 routes 中的所有 route.path 进行对比，匹配对应 route；
3. 将匹配到的 route 对应的组件，通过 `setContent` 设为当前显示的组件，触发重新渲染；

根据上述过程，代码如下

``` javascript
function refresh() {
  const pathname = window.location.pathname
  const content = routes.find(route => route.path === pathname)
  setContent(content)
}
```

现在已经基本实现了点击 `a` 标签，切换路由的功能。不过还差一点，当刷新页面或者前进后退时，会把页面重置为初始状态，这是因为在刷新页面后并未进行匹配，加上对页面刷新的监听即可：

``` javascript
useEffect(() => {
  refresh() // 刷新时触发匹配
  window.addEventListener('popstate', () => { refresh() })  // 浏览器前进后退时触发匹配
}, [])
```

完整代码可以参考 [ReactRouterDemo](https://github.com/SikyChen/simple-react-router/blob/main/src/ReactRouterDemo/index.jsx) 组件。


# 重构

现在来看一下 React-Router-Dom 的用法，参考该用法对我们的路由功能进行封装：

``` javascript
export default function App() {
  return (
    <BrowserRouter>
      <div>
        <div>
          <Link to="/aa">AA</Link>
          <Link to="/bb">BB</Link>
          <Link to="/cc">CC</Link>
          <Link to="/dd">DD</Link>
        </div>

        <Routes>
          <Route path="/aa"><AA /></Route>
          <Route path="/bb"><BB /></Route>
          <Route path="/cc"><CC /></Route>
          <Route path="/dd"><DD /></Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

从代码中可以看到，组合使用 `BrowserRouter` `Link` `Routes` `Route` 这几个组件即可实现一个简单的路由功能，而我们在上面简易实现当中所提到的 `handleLink` `refresh` 等逻辑都不需要编写，说明这些逻辑都被封装进组件当中了。

## 功能分析

重新对 `修改 URL` 和 `监听 URL 变化并匹配路由` 的过程进行分析：

点击 `Link` 组件会改变 URL ，类似我们之前实现过的 `handleLink` 的逻辑。对于 `history.pushState()` 对 URL 作出的改变无法监听的问题，这次我们使用状态管理的办法进行解决。

将 `location` 作为一份状态进行管理，当 `Link` 组件对该状态修改后，引入该状态的 `Routes` 将自动触发重新渲染，进而重新匹配 `Route` 进行显示。

## 实现 BrowserRouter 组件

通过上面的分析，可以想到 `BrowserRouter` 作为容器组件的作用，就是将 `location` 状态放在 `BrowserRouter` 中进行初始化，然后通过 `context` 共享给其子组件。示例代码如下：

``` javascript
// context.js
export const LocationContext = React.createContext(null)

// BrowserRouter.jsx
export default function BrowserRouter(props) {

  // ...

  const [location, setLocation] = useState(window.location)

  return (
    <LocationContext.Provider value={location}>
      {props.children}
    </LocationContext.Provider>
  )
}
```

由于 `handleLink` 时，需要对 `location` 进行修改，所以这里再多定义一个 `context` 用于将修改 `location` 的方法传给子组件，并补充上修改调用 `history.pushState` 方法的相关代码如下：

``` javascript
// context.js
export const LocationContext = React.createContext(null)
export const NavigatorContext = React.createContext(null)

// BrowserRouter.jsx
export default function BrowserRouter(props) {

  // ...

  const [location, setLocation] = useState(window.location)
  const navigator = {
    push: handlePush,
  }

  useEffect(() => {
    // 浏览器前进后退时触发更新
    window.addEventListener('popstate', updateLoaction)
  }, [])

  function updateLoaction() {
    setLocation({...window.location})
  }

  function handlePush(path) {
    // 保留 ?search 和 #hash
    const searchAndHash = location.href.split(location.pathname)[1];
    window.history.pushState({}, '', path + searchAndHash)
    updateLoaction()
  }

  return (
    <LocationContext.Provider value={location}>
      <NavigatorContext.Provider value={navigator}>
        {props.children}
      </NavigatorContext.Provider>
    </LocationContext.Provider>
  )
}
```

## 实现 Link 组件

现在只需要在 `Link` 组件中，调用 `navigator.push` 即可达到修改 URL 的目的了，所以对 `Link` 组件的实现如下：

``` javascript
// Link.jsx
export default const Link = React.forwardRef((props, ref) => {

  const navigator = React.useContext(NavigatorContext);

  function handleClick(e) {
    e.preventDefault()
    navigator.push(props.to)
  }

  return <a href={props.to} onClick={handleClick} ref={ref}>{props.children}</a>
})
```

## 实现 Routes Route 组件

为了方便使用，将 `path` 定义在 `Route` 上了，那么 `BrowserRouter` 容器组件很难知道都定义了那些 `path` ，也不方便跨多层控制。所以再新增一个 `Routes` 容器专门对匹配和渲染 `Route` 进行管理。

那么 `Routes` 的功能也呼之欲出了，就是读取 `location` 状态，拿到 `pathname` ，然后再遍历所有 `Route` 组件并比较其 `path` ，将匹配的 `Route` 显示即可，代码如下：

``` javascript
// Routes.jsx
export default const Routes = (props) => {

  const location = React.useContext(LocationContext);

  const route = useMemo(() => {
    return props.children.filter(child => child.props.path === location.pathname)
  }, [props.children, location.pathname])

  return route
}
```

而 `Route` 本身则比较简单，只需要将其子组件返回即可：

``` javascript
export default const Route = (props) => props.component
```

至此，使用组件的方式实现路由功能，就已经完成了。

# 结语

通过这次学习，揭开了 `React Router` 神秘的面纱，了解了前端路由的主流程并完成了一个简易实现。

基于这些核心逻辑，再去看 `React-Router-Dom` 的源码，相信会更容易理解些。

另外，本文所涉及的所有代码，可以在 [simple-react-router](https://github.com/SikyChen/simple-react-router) 中查看。
